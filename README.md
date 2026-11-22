# 🍲 Cookbook — Livro de Receitas

Aplicação web de **livro de receitas**: pesquise receitas na TheMealDB (por nome, categoria ou culinária), visualize ingredientes e modo de preparo e monte o seu caderno pessoal com avaliações (1–5 estrelas) e anotações.

---

## Integrantes da equipe

- **Edson Rocha da Silva**
- **David de Carvalho Santos**

---

## Nome e descrição do projeto

- **Nome do repositório:** `pweb-2026-cookbook` (repositório remoto: `https://github.com/eddieJPNG/pweb-2026-cookbook.git`)
- **Nome exibido na aplicação:** **Cookbook — Livro de Receitas** (título definido em `app/layout.tsx`: `"Cookbook | Livro de Receitas"`)
- **Observação objetiva:** o campo `name` do `package.json` está como `"temp"` (valor provisório deixado na inicialização do projeto); a identidade real do projeto está no repositório e no layout da aplicação.

**Descrição:** projeto acadêmico de Programação Web que consome a API pública **TheMealDB** para busca e exibição de receitas e mantém um **caderno de receitas persistido localmente em SQLite**, no qual o usuário salva receitas, avalia de 1 a 5 estrelas, escreve anotações e remove itens. A aplicação é um Next.js (App Router) com frontend e backend no mesmo projeto.

---

## Principais funcionalidades

1. **Busca de receitas** (`components/meals/SearchForm.tsx` na página `/`):
   - Pesquisa por **nome** (texto livre), **categoria** ou **culinária** (`area`/área) — o usuário escolhe o tipo em um seletor e envia **exatamente um critério** por vez.
   - As opções dos seletores de categoria e culinária vêm de `GET /api/filters`.
   - Exibe lista de resultados (imagem, nome, categoria e culinária) com estados de **carregamento**, **vazio** e **erro**.
   - As seções de categorias apresentadas na home (`app/page.tsx`) são **cards estáticos** de demonstração (Saladas, Massas, Sobremesas, Pratos principais); os filtros reais de pesquisa são os vindos da API.
2. **Visualização de detalhes da receita** (`/meals/[id]`):
   - Imagem, nome, categoria, culinária, lista de ingredientes com medidas e modo de preparo em passos numerados.
   - Botão **"Adicionar ao meu caderno"**, que abre o formulário de avaliação/nota e envia `POST /api/cookbook`.
3. **Caderno de receitas** (`/cookbook`):
   - **Listagem** dos registros salvos (imagem, nome, estrelas e nota), com estado vazio.
   - **Avaliação (1–5)** e **anotação (até 500 caracteres)** via página de edição `/cookbook/[id]`.
   - **Remoção** de receita do caderno, com confirmação.
   - Salvar (adicionar), listar, editar e remover também estão disponíveis pela API REST descrita abaixo. Na interface, a edição/remoção usa **Server Actions** (`app/cookbook/actions.ts`) que chamam diretamente as funções de `lib/db.ts`, enquanto a adição usa a rota `POST /api/cookbook`.

---

## API externa utilizada — TheMealDB

- **Cliente próprio:** `lib/mealdb.ts`
- **URL base usada no código:**

  ```ts
  const BASE_URL = "https://www.themealdb.com/api/json/v1/1"; // lib/mealdb.ts
  ```

- **Endpoints externos consumidos** (todos montados a partir de `BASE_URL`):

  | Endpoint externo | Uso no projeto |
  |---|---|
  | `search.php?s=<nome>` | Busca por nome |
  | `filter.php?c=<categoria>` | Busca por categoria |
  | `filter.php?a=<area>` | Busca por culinária (área) |
  | `lookup.php?i=<id>` | Detalhes da receita (também usado no `POST /api/cookbook` para obter `name` e `image_url`) |
  | `list.php?c=list` | Lista de categorias |
  | `list.php?a=list` | Lista de culinárias (áreas) |

- **Comportamento:** timeout de 5000 ms (`REQUEST_TIMEOUT_MS`), falhas de rede/HTTP/JSON são convertidas em `MealDbError` e respondidas ao cliente com **502**. Não há chave de API (usa-se a chave pública `1` da URL base).

---

## Endpoints do backend

Rotas implementadas em `app/api/**/route.ts`. Todos os erros são retornados no formato `{ "error": "mensagem em português" }`.

| Método | Rota | Finalidade | Parâmetros |
|---|---|---|---|
| `GET` | `/api/meals` | Buscar receitas na TheMealDB | Query params: **`name`**, **`category`** ou **`area`** — **exatamente um** deve ser informado (após `trim`, não vazio) |
| `GET` | `/api/meals/[id]` | Obter detalhes de uma receita | Path param: **`id`** (identificador numérico da TheMealDB) |
| `GET` | `/api/filters` | Listar categorias e culinárias | Nenhum |
| `GET` | `/api/cookbook` | Listar receitas do caderno (registros locais) | Nenhum |
| `POST` | `/api/cookbook` | Adicionar receita ao caderno | Body (JSON ou formulário) |
| `PATCH` | `/api/cookbook/[id]` | Atualizar avaliação e/ou anotação | Path param: **`id`** = **id local do registro** na tabela `cookbook`; Body (JSON ou formulário) |
| `DELETE` | `/api/cookbook/[id]` | Remover receita do caderno | Path param: **`id`** = **id local do registro** na tabela `cookbook` |

### `GET /api/meals`

- **Regra de exatamente um critério:** os query params aceitos são **`name`**, **`category`** e **`area`**. Cada valor passa por `trim()`; são coletados os critérios não vazios e, se a quantidade não for **exatamente 1**, a rota responde **400** com:
  ```json
  { "error": "Informe exatamente um critério de busca: name, category ou area." }
  ```
- Exemplos: `/api/meals?name=chicken`, `/api/meals?category=Seafood`, `/api/meals?area=Italian`.
- **Sucesso (200):** array de resumos:
  ```json
  [{ "id": "52977", "name": "Corba", "image_url": "https://...", "category": "Vegetarian", "area": "Turkish" }]
  ```
  (buscas por `category`/`area` não trazem esses campos na resposta externa; a rota preenche com o critério informado; a busca por nome pode retornar `category`/`area` nulos quando ausentes)
- **Falha na TheMealDB:** 502.

### `GET /api/meals/[id]`

- `id` deve conter apenas dígitos (`/^\d+$/`) → caso contrário **400** (`"Identificador de receita inválido."`).
- Receita inexistente → **404**; falha externa → **502**.
- **Sucesso (200):**
  ```json
  {
    "id": "52977",
    "name": "Corba",
    "image_url": "https://...",
    "category": "Vegetarian",
    "area": "Turkish",
    "ingredients": [{ "ingredient": "Red Lentils", "measure": "1 cup" }],
    "steps": ["Passo 1...", "Passo 2..."]
  }
  ```
- Ingredientes são extraídos de `strIngredient1..20`/`strMeasure1..20` (vazios descartados); os passos são derivados de `strInstructions` (quebras de linha ou, na ausência, separação por frases).

### `GET /api/filters`

- Sem parâmetros. **Sucesso (200):**
  ```json
  { "categories": ["Beef", "Chicken", "..."], "areas": ["American", "British", "..."] }
  ```
- Falha externa → 502.

### `GET /api/cookbook`

- Sem parâmetros. **Sucesso (200):** array com todos os registros locais, ordenados por `created_at DESC, id DESC`:
  ```json
  [{ "id": 1, "meal_id": "52977", "name": "Corba", "image_url": "https://...", "rating": 5, "note": "...", "created_at": "2026-11-21T..." }]
  ```

### `POST /api/cookbook`

- **Body aceito:** `application/json` **ou** formulário (`form-urlencoded`/`multipart`).
- **Campos:**

  | Campo | Obrigatório | Tipo/regra |
  |---|---|---|
  | `meal_id` | Sim | string não vazia (após `trim`) — id da TheMealDB |
  | `rating` | Sim | inteiro de **1 a 5** (aceita número ou string numérica) |
  | `note` | Não | string de até **500** caracteres; vazio/ausente/`null` → `null` |

- **`name` e `image_url` não dependem do cliente:** ainda que a página de detalhe os envie, a rota ignora-os e busca os dados reais via `GET lookup.php?i=<meal_id>` na TheMealDB. `created_at` é preenchido pelo backend.
- **Códigos:** corpo inválido → **400**; `meal_id` já existente no caderno → **409** (`"Receita já existente no caderno."`); receita inexistente na TheMealDB → **404**; falha externa → **502**; sucesso → **201** com o registro criado.

### `PATCH /api/cookbook/[id]`

- **`[id]` é o identificador local do registro** (coluna `id` da tabela `cookbook`), **não** o `meal_id` da TheMealDB. Deve ser numérico (`/^\d+$/`) → senão **400** (`"Identificador do caderno inválido."`).
- **Body aceito:** JSON ou formulário, com **ao menos um** dos campos:
  - `rating`: inteiro de 1 a 5;
  - `note`: string de até 500 caracteres, ou `null`/vazio para limpar a nota.
- Sem nenhum dos campos → **400**; campo inválido → **400**; registro inexistente → **404**.
- **Sucesso (200):** retorna o registro atualizado. Campos ausentes mantêm o valor atual (apenas `rating` e `note` são atualizáveis).

### `DELETE /api/cookbook/[id]`

- **`[id]` é o identificador local do registro** na tabela `cookbook`; numérico, senão **400**.
- Registro inexistente → **404**; sucesso → **204** sem corpo.

---

## Estrutura da tabela `cookbook` e banco SQLite

### Banco

- **Driver/ORM:** `better-sqlite3` (prepared statements, sem concatenação de SQL).
- **Arquivo SQLite:** criado automaticamente em **`data/app.db`** — `path.join(process.cwd(), "data", "app.db")` (`lib/db.ts`); o diretório `data/` é criado com `fs.mkdirSync(..., { recursive: true })` se não existir.
- O diretório `data/` e arquivos `*.db` estão no `.gitignore` (banco local, fora do versionamento).
- Pragmas definidos na conexão: `journal_mode = DELETE` (WAL **não** é usado) e `foreign_keys = ON`.
- A conexão é única e cacheada em `globalThis` (importante para HMR do Next).

### Colunas da tabela `cookbook`

Criada com `CREATE TABLE IF NOT EXISTS` (`lib/db.ts`):

| Coluna | Tipo | Significado | Editável? |
|---|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Identificador **local** do registro no banco (usado em `/api/cookbook/[id]`) | **Imutável** — gerado automaticamente pelo SQLite |
| `meal_id` | `TEXT NOT NULL UNIQUE` | Identificador da receita na TheMealDB | **Imutável** após criação (definido no `POST`; o `PATCH` não altera) |
| `name` | `TEXT NOT NULL` | Nome da receita (obtido da TheMealDB no `POST`) | **Imutável** após criação |
| `image_url` | `TEXT NOT NULL` | URL da imagem da receita (obtida da TheMealDB no `POST`) | **Imutável** após criação |
| `rating` | `INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5)` | Avaliação de 1 a 5 estrelas | **Editável** via `PATCH /api/cookbook/[id]` (e obrigatório no `POST`) |
| `note` | `TEXT CHECK (note IS NULL OR length(note) <= 500)` | Anotação pessoal (até 500 caracteres, pode ser nula) | **Editável** via `PATCH /api/cookbook/[id]` (opcional no `POST`) |
| `created_at` | `TEXT NOT NULL` | Data/hora de criação em formato ISO 8601 (`new Date().toISOString()`) | **Imutável** — preenchida automaticamente pelo backend |

### Registros iniciais (seed)

- **Função `seed(db)`** em `lib/db.ts`, chamada dentro de `createConnection()`.
- **Quando:** na **primeira abertura da conexão** com o banco (ou seja, no primeiro acesso a qualquer função de `lib/db.ts` — p. ex. ao acessar `/cookbook` ou a uma rota de API — durante `next dev`/`next build`/`next start`), **somente se a tabela estiver vazia**: `shouldSeed()` verifica `SELECT COUNT(*) AS n FROM cookbook` e só semeia quando `n === 0`.
- **Como:** os 5 registros são inseridos em uma única transação (`db.transaction`), todos com o mesmo `created_at` (ISO do momento do seed).
- **Total: 5 registros** (dentro da faixa 3–10):

  | `meal_id` | `name` | `rating` | `note` |
  |---|---|---|---|
  | `52977` | Corba | 5 | Sopa de lentilhas turca — tentar com mais limão na próxima. |
  | `52772` | Teriyaki Chicken Casserole | 4 | *(sem nota)* |
  | `53013` | Big Mac | 2 | Dá para replicar o molho; o resto é muito pesado. |
  | `52785` | Dal fry | 5 | *(sem nota)* |
  | `52855` | Banana Pancakes | 3 | Café da manhã rápido; usar banana bem madura. |

- Os `image_url` dos seeds apontam para as imagens públicas da TheMealDB. **Não há migrações**: a criação da tabela e o seed ocorrem na inicialização da conexão.

---

## Tecnologias utilizadas

| Tecnologia | Versão (em `package.json`) | Uso |
|---|---|---|
| Node.js | ver seção abaixo | Runtime |
| Next.js | `^16.4.6` (instalado: 16.4.6) | Framework (App Router, `cacheComponents`, Turbopack — `next.config.ts`) |
| React / React DOM | `^19.3.1` | UI |
| TypeScript | `^5` | Tipagem (modo `strict` no `tsconfig.json`) |
| Tailwind CSS | `^4` (+ `@tailwindcss/turbopack`) | Estilização (loader de CSS configurado em `next.config.ts`; tema em `app/globals.css`) |
| better-sqlite3 | `^13.0.3` (+ `@types/better-sqlite3`) | Driver SQLite síncrono do caderno |
| ESLint / eslint-config-next | `^10.14.0` / `^0.2.4` | Lint (`npm run lint`) |
| Fontes Geist / Geist Mono | via `next/font/google` | Tipografia |
| TheMealDB | API REST pública | Dados de receitas (sem chave de API) |

**Observações objetivas:**
- A dependência **`clear` (`^0.1.0`)** está listada no `package.json`, mas **não é importada em nenhum arquivo** do código-fonte (`app/`, `components/`, `lib/`).
- **Não há variáveis de ambiente**: nenhuma leitura de `process.env`/`.env` existe no código e não há arquivos `.env*` no repositório.

---

## Versão do Node.js

- **Não há restrição explícita no projeto:** não existem `.nvmrc`, `.node-version` nem campo `engines` no `package.json`.
- **Restrições implícitas das dependências:** Next.js 16 exige `node >= 20.9.0` e `better-sqlite3` v13 exige `node >= 22` → na prática, **Node.js 22 ou superior**.
- **Versão usada no ambiente de desenvolvimento deste repositório:** **v26.12.1**.

---

## Instruções para executar o projeto

**Pré-requisitos:** Node.js 22+ e npm. Nenhuma variável de ambiente é necessária (não há `.env`).

```bash
# 1. Clonar o repositório
git clone https://github.com/eddieJPNG/pweb-2026-cookbook.git
cd pweb-2026-cookbook

# 2. Instalar dependências
npm install

# 3. Iniciar em modo de desenvolvimento
npm run dev
```

A aplicação ficará disponível em **http://localhost:3000**.

Na **primeira execução**, o diretório `data/` e o banco `data/app.db` são criados automaticamente e a tabela `cookbook` é populada com os 5 registros de seed (apenas se estiver vazia). Não é preciso rodar migrações.

**Outros scripts disponíveis** (em `package.json`):

```bash
npm run build   # build de produção (next build)
npm run start   # inicia o build de produção (next start)
npm run lint    # verifica o código com ESLint
```

---

## Estrutura de pastas

```
app/
├── api/
│   ├── meals/route.ts           # GET /api/meals
│   ├── meals/[id]/route.ts      # GET /api/meals/[id]
│   ├── filters/route.ts         # GET /api/filters
│   └── cookbook/
│       ├── route.ts             # GET e POST /api/cookbook
│       └── [id]/route.ts        # PATCH e DELETE /api/cookbook/[id]
├── cookbook/
│   ├── page.tsx                 # listagem do caderno
│   ├── [id]/page.tsx            # edição de rating/note
│   ├── actions.ts               # server actions (update/delete)
│   ├── RatingForm.tsx           # formulário de estrelas + nota
│   └── DeleteButton.tsx         # botão de exclusão
├── meals/[id]/                  # página de detalhe da receita
├── page.tsx                     # home + busca
└── layout.tsx                   # layout raiz (nav, footer, metadata)
components/meals/SearchForm.tsx  # formulário de busca com filtros
lib/
├── mealdb.ts                    # cliente da TheMealDB
├── api.ts                       # cliente fetch das rotas /api
└── db.ts                        # conexão SQLite, schema, seed e helpers
data/app.db                      # banco SQLite (gerado, fora do versionamento)
```
