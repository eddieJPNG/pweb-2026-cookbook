# Plano de Implementação — Frontend (Fases 5, 6 e 7)

Este documento detalha exclusivamente a camada de frontend do projeto `pweb-2026-cookbook`, com foco didático: além do código, explicamos o **porquê** de cada decisão, para que o conteúdo sirva de ensino e não apenas de receita.

O frontend consome a API própria (`/api/meals`, `/api/filters`, `/api/cookbook`) que deve estar implementada nas fases de backend. Toda comunicação com o TheMealDB acontece **apenas** via backend; o frontend nunca chama a API externa diretamente.

---

## Fase 5 — Estrutura e busca

### Objetivo

Criar a navegação raiz, a página de busca e os componentes reutilizáveis (`MealCard`, `SearchForm`), com estados de carregamento, vazio e erro.

### Por que usar App Router e Server Components?

No Next.js 16, o `app/` utiliza o **App Router**. Por padrão, os componentes dentro de `app/` são **Server Components**. Isso significa que eles rodam no servidor, enviando apenas o HTML resultado para o navegador. Vantagens didáticas:

- **Menos JavaScript no cliente:** a página chega pronta para ser renderizada, melhorando o desempenho em dispositivos lentos.
- **Busca de dados próxima ao servidor:** o servidor pode chamar `/api/meals` com latência de rede interna (geralmente menor que do navegador até a API externa).
- **Segurança:** chaves de API e lógica sensível nunca expostas ao navegador.

Por outro lado, componentes que precisam de interatividade (estado, `useEffect`, eventos de clique) devem ser marcados com `"use client"` e viram **Client Components**.

### 5.1 Layout raiz (`app/layout.tsx`)

O layout envolve todas as páginas. Aqui definimos o `lang`, as fontes globais e a estrutura de navegação compartilhada.

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cookbook — Livro de Receitas",
  description: "Busque e cadastre suas receitas favoritas com o TheMealDB.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Cabeçalho fixo em todas as páginas */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                🍳 Cookbook
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                  Busca
                </Link>
                <Link href="/cookbook" className="text-sm font-medium hover:text-primary transition-colors">
                  Caderno
                </Link>
              </div>
            </div>
          </nav>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-border bg-muted/50 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
            pweb-2026-cookbook • Dados de receitas via TheMealDB
          </div>
        </footer>
      </body>
    </html>
  );
}
```

#### Explicação didática linha a linha

- **`import type { Metadata } from "next"`:** definimos metadados de SEO (título, descrição) de forma tipada. O Next.js usa isso para gerar `<title>` e `<meta name="description">` automaticamente no HTML.
- **`next/font/google`:** carrega a fonte Geist diretamente do Google Fonts, otimizada pelo Next.js (auto-hospedada no build, evitando requisições externas em tempo de execução).
- **`LayoutProps<"/">`:** tipagem dos filhos do layout. O `"/"` indica que este é o layout raiz.
- **`lang="pt-BR"`:** importante para leitores de tela e para o navegador entender o idioma da página.
- **`Link` do Next.js:** em vez de `<a href>`, usamos `<Link>` para navegação entre páginas do lado do cliente sem recarregar o navegador inteiro (Single Page Application behavior).
- **`className="bg-background text-foreground"`:** usamos variáveis CSS do Tailwind definidas em `globals.css`, que se adaptam ao modo escuro/claro automaticamente.

### 5.2 Página de busca (`app/page.tsx`)

Esta é a página inicial. É um **Server Component** porque precisa buscar dados do servidor (`/api/filters` para categorias e culinárias) antes de renderizar.

```tsx
// app/page.tsx
import { SearchForm } from "@/components/search-form";

interface MealsPageProps {
  searchParams: Promise<{ nome?: string; categoria?: string; area?: string }>;
}

export default async function MealsPage({
  searchParams,
}: MealsPageProps) {
  const params = await searchParams;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Buscar receitas</h1>
      <SearchForm
        defaultNome={params.nome ?? ""}
        defaultCategoria={params.categoria ?? ""}
        defaultArea={params.area ?? ""}
      />
    </section>
  );
}
```

#### Por que `searchParams` é uma `Promise`?

No Next.js 15+, `searchParams` e `params` são **promessas** para permitir o uso de `await`. Isso garante que o servidor aguarde a resolução dos parâmetros antes de renderizar, evitando condições de corrida (race conditions) quando o usuário navega rapidamente entre filtros.

#### Por que a página é assíncrona (`async function`)?

Porque precisamos `await` nos parâmetros e, em breve, `await` na busca dos dados das receitas. Server Components assíncronos podem buscar dados diretamente no servidor, sem `useEffect` no cliente.

### 5.3 Componente `SearchForm` (Client Component)

O formulário precisa de estado local (o que o usuário digitou) e eventos de submit, então é um Client Component.

```tsx
// components/search-form.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Criterion = "nome" | "categoria" | "area";

interface SearchFormProps {
  defaultNome?: string;
  defaultCategoria?: string;
  defaultArea?: string;
}

export function SearchForm({
  defaultNome = "",
  defaultCategoria = "",
  defaultArea = "",
}: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [criterion, setCriterion] = useState<Criterion>("nome");
  const [value, setValue] = useState(defaultNome);

  // Quando os parâmetros da URL mudam (navegação via <Link>), atualizamos o estado local.
  // Isso mantém o formulário sincronizado com a URL.
  if (searchParams.get("nome") !== null) {
    setCriterion("nome");
    setValue(searchParams.get("nome") ?? defaultNome);
  } else if (searchParams.get("categoria") !== null) {
    setCriterion("categoria");
    setValue(searchParams.get("categoria") ?? defaultCategoria);
  } else if (searchParams.get("area") !== null) {
    setCriterion("area");
    setValue(searchParams.get("area") ?? defaultArea);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Validação: exatamente um critério deve ter valor preenchido.
    // O backend exige exatamente um critério; senão retorna 400.
    const trimmed = value.trim();
    if (!trimmed) {
      alert("Preencha o valor da busca.");
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("nome");
    nextSearchParams.delete("categoria");
    nextSearchParams.delete("area");
    nextSearchParams.set(criterion, trimmed);

    router.push(`/?${nextSearchParams.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <label htmlFor="criterion" className="text-sm font-medium sr-only">
          Critério de busca
        </label>
        <select
          id="criterion"
          value={criterion}
          onChange={(e) => setCriterion(e.target.value as Criterion)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="nome">Por nome da receita</option>
          <option value="categoria">Por categoria</option>
          <option value="area">Por culinária (área)</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="value" className="text-sm font-medium sr-only">
          Valor da busca
        </label>
        <input
          id="value"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Digite o que procura..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
      >
        Buscar
      </button>
    </form>
  );
}
```

#### Explicação didática

- **`"use client"`:** obrigatório para usar hooks (`useState`, `useRouter`, `useSearchParams`). Sem isso, o Next.js gera erro porque Client Components precisam ser bundados para o navegador.
- **`useRouter()`:** permite navegação programática. `router.push` muda a URL sem recarregar a página.
- **`useSearchParams()`:** lê os parâmetros atuais da URL (ex: `?nome=macarrao`). Usamos para manter o estado do formulário sincronizado com a URL, permitindo que o usuário compartilhe o link da busca.
- **Validação "exatamente um critério":** o backend (Fase 3) exige exatamente um dos parâmetros `nome`, `categoria` ou `area`. No frontend, limpamos os outros dois antes de enviar, evitando erro 400 desnecessário.
- **`sr-only`:** classes de acessibilidade. O rótulo é escondido visualmente mas permanece disponível para leitores de tela, mantendo o formulário acessível sem poluir o layout.

### 5.4 Componente `MealCard` (Server Component)

Recebe os dados de uma receita e renderiza um card. Não precisa de interatividade, então é Server Component.

```tsx
// components/meal-card.tsx
import Link from "next/link";
import Image from "next/image";

interface MealCardProps {
  id: string;
  name: string;
  image_url: string;
}

export function MealCard({ id, name, image_url }: MealCardProps) {
  return (
    <article className="rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/meals/${id}`} className="block">
        <Image
          src={image_url}
          alt={`Foto da receita ${name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          className="object-cover"
        />
      </Link>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          Toque para ver ingredientes e passo a passo.
        </p>
      </div>
    </article>
  );
}
```

#### Por que `next/Image` em vez de ``?

O componente `Image` do Next.js faz otimização automática: redimensionamento, compressão, lazy loading nativo e formato moderno (WebP/AVIF quando suportado). Isso reduz drasticamente o tamanho transferido em redes móveis.

#### Por que `sizes` e `fill`?

- **`fill`:** faz a imagem preencher o container do card, permitindo que o Next.js calcule as dimensões idealmente.
- **`sizes`:** informa ao navegador qual largura a imagem ocupará em diferentes tamanhos de tela, ajudando a escolher a versão otimizada correta e evitando layout shift (CLS).

### 5.5 Página de listagem de resultados

Quando a busca retorna receitas, renderizamos os cards. Esta página combina Server Component (busca de dados) com Client Component (MealCard é puro, mas pode ser Server também; aqui usamos diretamente).

```tsx
// app/meals/page.tsx
import { MealCard } from "@/components/meal-card";

interface Meal {
  id: string;
  name: string;
  image_url: string;
}

interface MealsListPageProps {
  searchParams: Promise<{ nome?: string; categoria?: string; area?: string }>;
}

export default async function MealsListPage({
  searchParams,
}: MealsListPageProps) {
  const params = await searchParams;

  // Monta a query string para chamar nossa própria API
  const query = new URLSearchParams();
  if (params.nome) query.set("nome", params.nome);
  if (params.categoria) query.set("categoria", params.categoria);
  if (params.area) query.set("area", params.area);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/meals?${query}`, {
    cache: "no-store", // sempre busca dados frescos
  });

  if (!res.ok) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          Não foi possível carregar as receitas. Tente novamente mais tarde.
        </div>
      </section>
    );
  }

  const meals: Meal[] = await res.json();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold mb-6">Resultados da busca</h2>

      {meals.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted p-8 text-center text-muted-foreground">
          Nenhuma receita encontrada com esses critérios.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meals.map((meal) => (
            <MealCard key={meal.id} {...meal} />
          ))}
        </div>
      )}
    </section>
  );
}
```

#### Explicação didática

- **`fetch` no servidor:** Server Components podem chamar `fetch` diretamente. No Next.js, `fetch` é estendido para suportar cache (`cache: "no-store"` para dados que mudam frequentemente, como resultados de busca).
- **Tratamento de erro 400/502:** se o backend retornar erro, mostramos uma mensagem amigável em vez de quebrar a página. Isso é essencial para boa experiência de usuário.
- **Estado vazio:** quando `meals.length === 0`, mostramos uma mensagem em vez de uma grade vazia, comunicando ao usuário que a busca funcionou mas não encontrou nada.
- **Grid responsivo:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` significa 1 coluna em celular, 2 em tablets e 3 em desktops, sem escrever media queries manuais.

---

## Fase 6 — Detalhe e caderno

### Objetivo

Criar a página de detalhe da receita (`app/meals/[id]/page.tsx`) e a página do caderno (`app/cookbook/page.tsx`), com adição, edição e remoção de receitas salvas localmente.

### 6.1 Página de detalhe (`app/meals/[id]/page.tsx`)

É um Server Component que busca os detalhes da receita via `/api/meals/[id]`.

```tsx
// app/meals/[id]/page.tsx
import Link from "next/link";

interface MealDetail {
  id: string;
  name: string;
  image_url: string;
  category: string;
  area: string;
  ingredients: { ingredient: string; measure: string }[];
  steps: string[];
}

interface MealDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MealDetailPage({
  params,
}: MealDetailPageProps) {
  const { id } = await params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/meals/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return notFound(); // Next.js renderiza a página 404 (app/not-found.tsx)
  }

  if (!res.ok) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          Erro ao carregar os detalhes da receita.
        </div>
      </section>
    );
  }

  const meal: MealDetail = await res.json();

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <Image
            src={meal.image_url}
            alt={meal.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="rounded-lg object-cover"
          />
        </div>
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold">{meal.name}</h1>
          <p className="text-sm text-muted-foreground">
            {meal.category} • {meal.area}
          </p>

          <section>
            <h2 className="text-xl font-bold mb-3">Ingredientes</h2>
            <ul className="space-y-2 text-sm">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{ing.measure}</span>
                  <span>{ing.ingredient}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Modo de preparo</h2>
            <ol className="space-y-3 text-sm leading-relaxed">
              {meal.steps.map((step, i) => (
                <li key={i}>
                  <span className="font-medium text-primary">{i + 1}.</span>{" "}
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <form
            action="/api/cookbook"
            method="post"
            className="mt-6 space-y-2"
          >
            <input type="hidden" name="meal_id" value={meal.id} />
            <input type="hidden" name="name" value={meal.name} />
            <input type="hidden" name="image_url" value={meal.image_url} />
            <button
              type="submit"
              className="w-full rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              Adicionar ao caderno
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Voltar à busca
        </Link>
      </div>
    </article>
  );
}
```

#### Explicação didática

- **`notFound()`:** função do Next.js que dispara a renderização da página `app/not-found.tsx` (404). É a maneira correta de lidar com receitas inexistentes no servidor.
- **Formulário sem JavaScript:** o botão "Adicionar ao caderno" usa um `<form action="/api/cookbook" method="post">` puro HTML. Isso funciona mesmo com JavaScript desabilitado (Progressive Enhancement). O Next.js lida com o submit e o servidor cria a entrada no banco.
- **Campos ocultos (`<input type="hidden">`):** enviamos `meal_id`, `name` e `image_url` para o backend salvar no banco local. O backend busca os dados resumidos na API externa se necessário (conforme Fase 4 do plano).

### 6.2 Página do caderno (`app/cookbook/page.tsx`)

Lista as receitas salvas localmente e permite editar avaliação/anotação e remover.

```tsx
// app/cookbook/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CookbookEntry {
  id: number;
  meal_id: string;
  name: string;
  image_url: string;
  rating: number;
  note: string | null;
  created_at: string;
}

export default function CookbookPage() {
  const [entries, setEntries] = useState<CookbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const res = await fetch("/api/cookbook", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar o caderno");
      setEntries(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function updateEntry(id: number, formData: FormData) {
    const rating = Number(formData.get("rating"));
    const note = String(formData.get("note") ?? "");

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Avaliação deve ser um número entre 1 e 5.");
      return;
    }

    const res = await fetch(`/api/cookbook/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, note: note || null }),
    });

    if (res.status === 404) {
      setError("Receita não encontrada no caderno.");
      return;
    }
    if (!res.ok) {
      setError("Falha ao atualizar a receita.");
      return;
    }

    setEditingId(null);
    setError(null);
    await loadEntries();
  }

  async function removeEntry(id: number) {
    if (!window.confirm("Tem certeza que deseja remover esta receita do caderno?")) {
      return;
    }

    const res = await fetch(`/api/cookbook/${id}`, { method: "DELETE" });

    if (res.status === 404) {
      setError("Receita não encontrada no caderno.");
      return;
    }
    if (!res.ok) {
      setError("Falha ao remover a receita.");
      return;
    }

    setError(null);
    await loadEntries();
  }

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          Carregando caderno...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
          <button
            onClick={() => {
              setError(null);
              loadEntries();
            }}
            className="mt-2 text-sm text-primary underline underline-offset-4 hover:text-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-lg border border-border bg-muted p-8 text-center text-muted-foreground">
          <h2 className="text-lg font-medium">Seu caderno está vazio</h2>
          <p className="text-sm">Adicione receitas na página de busca.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
            Ir para a busca →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Meu Caderno</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <Link href={`/meals/${entry.meal_id}`} className="text-lg font-semibold hover:underline">
                {entry.name}
              </Link>
              {editingId === entry.id ? (
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Cancelar
                </button>
              ) : (
                <button
                  onClick={() => setEditingId(entry.id)}
                  className="text-xs text-primary hover:text-primary/90 underline underline-offset-4"
                >
                  Editar
                </button>
              )}
            </div>

            <Image
              src={entry.image_url}
              alt={entry.name}
              width={200}
              height={200}
              className="rounded-md object-cover mb-3"
            />

            {editingId === entry.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateEntry(entry.id, new FormData(e.currentTarget));
                }}
                className="space-y-2"
              >
                <div>
                  <label className="block text-xs font-medium mb-1">Avaliação (1 a 5)</label>
                  <input
                    type="number"
                    name="rating"
                    defaultValue={entry.rating}
                    min="1"
                    max="5"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Anotação (máx. 500 chars)</label>
                  <textarea
                    name="note"
                    defaultValue={entry.note ?? ""}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
                >
                  Salvar
                </button>
              </form>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Avaliação: <span className="font-medium">{entry.rating}</span> / 5
                </p>
                {entry.note ? (
                  <p className="text-sm text-foreground">{entry.note}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem anotação.</p>
                )}
              </div>
            )}

            <button
              onClick={() => removeEntry(entry.id)}
              className="mt-3 w-full rounded-md border border-destructive bg-destructive/10 px-4 py-2 text-sm text-destructive hover:bg-destructive/20 transition-colors"
            >
              Remover do caderno
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
```

#### Explicação didática

- **`"use client"` e hooks:** este componente precisa de `useState` (dados, erro, modo edição) e `useEffect` (carregar dados ao montar), portanto é Client Component.
- **`fetch` no cliente:** diferentemente da página de busca (Server Component), aqui usamos `fetch` dentro de `useEffect` e handlers de evento, porque a interação acontece no navegador.
- **`JSON.stringify` e `Content-Type: application/json`:** o backend espera JSON no corpo de `PATCH`. Enviar como `form-urlencoded` faria o servidor não conseguir ler os campos corretamente.
- **`window.confirm`:** confirmação nativa do navegador antes de remover. Evita remoções acidentais.
- **Estado de erro com botão "Tentar novamente":** permite que o usuário recupere de falhas de rede sem recarregar a página inteira.
- **Modo edição inline:** em vez de navegar para outra página, editamos dentro do próprio card. Isso reduz navegação e torna a experiência mais fluida.

### 6.3 Compartilhamento de tipos

Como o frontend usa TypeScript, convém manter os tipos sincronizados com o backend. No exemplo acima, `CookbookEntry` é declarado localmente. Em um projeto maior, você poderia criar `lib/types.ts` e importar em ambos os lados (se compartilhado) ou manter tipos separados em `app/` e `lib/`.

---

## Fase 7 — Qualidade: responsividade e acessibilidade

### Objetivo

Garantir que o aplicativo funcione bem em qualquer tamanho de tela e seja usável por pessoas com deficiência (leitores de tela, navegação por teclado, contraste adequado).

### 7.1 Responsividade com Tailwind

Tailwind usa prefixos de breakpoint (`sm`, `md`, `lg`, `xl`). A lógica didática é:

- **Mobile-first:** escrevemos estilos para telas pequenas por padrão.
- **Adicionamos exceções:** `md:` só se aplica a partir de telas médias, `lg:` a partir de grandes, etc.

Exemplo prático já usado no caderno:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

Isso significa: 1 coluna por padrão (celular), 2 colunas a partir de `md` (tablets pequenos), 3 colunas a partir de `lg` (desktops). Não escrevemos `@media` manualmente.

### 7.2 Acessibilidade (a11y) checklist

| Item | Como implementar | Por que |
|------|------------------|---------|
| Idioma da página | `<html lang="pt-BR">` | Leitores de tela usam a sintaxe correta |
| Rótulos de formulário | `<label htmlFor="...">` ou `sr-only` | Usuários de leitor de tela sabem o que preencher |
| Navegação por teclado | Elementos nativos (`<button>`, `<a>`, `<input>`) | Funcionam com Tab sem esforço extra |
| Foco visível | Tailwind `focus:ring-1 focus:ring-primary` | Usuário sabe onde está no teclado |
| Texto alternativo | `alt` em `<Image>` e `` | Usuários cegos sabem o que a imagem mostra |
| Contraste | Cores semânticas (`text-primary`, `bg-primary`) | Legibilidade para baixa visão |
| Mensagens de erro | Texto descritivo em português | Usuário entende o que deu errado e como corrigir |

### 7.3 Exemplo de componente acessível

O `SearchForm` já usa `sr-only` nos rótulos. Outro exemplo: botões de remoção no caderno usam `<button>` nativo (não `<div onClick>`), garantindo que Enter e Espaço disparam a ação no teclado.

---

## Resumo das rotas de frontend criadas

| Caminho | Tipo | Função |
|---------|------|--------|
| `/` | Server | Busca com formulário e lista de resultados |
| `/meals/[id]` | Server | Detalhe da receita + adicionar ao caderno |
| `/cookbook` | Client | Listar, editar e remover receitas salvas |

## Próximos passos após o frontend

1. Implementar `app/not-found.tsx` para personalizar a página 404.
2. Adicionar loading UI com `app/loading.tsx` (Suspense) para transições suaves entre páginas.
3. Validar dados no cliente com Zod ou validação manual antes de enviar ao backend, reduzindo requisições desnecessárias.
