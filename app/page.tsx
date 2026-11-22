import SearchForm from "@/components/meals/SearchForm";
import Link from "next/link";

const categories = [
  {
    name: "Saladas",
    description: "Opções leves e refrescantes",
    emoji: "🥗",
  },
  {
    name: "Massas",
    description: "Sabores para todas as ocasiões",
    emoji: "🍝",
  },
  {
    name: "Sobremesas",
    description: "Um toque doce no seu dia",
    emoji: "🍰",
  },
  {
    name: "Pratos principais",
    description: "Receitas para refeições especiais",
    emoji: "🍗",
  },
];

export default function Home() {
  return (
    <div>
      {/* Apresentação principal */}
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">

          <span className="text-sm font-semibold uppercase tracking-widest text-green-100">
            Seu livro de receitas digital
          </span>

          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Descubra novos sabores e encontre sua próxima receita favorita.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-green-50">
            Explore receitas, experimente novos pratos e organize
            suas descobertas culinárias em um só lugar.
          </p>

          <Link
            href="#categorias"
            className="mt-9 inline-flex rounded-full bg-white px-7 py-3 font-semibold text-primary transition-colors hover:bg-green-50"
          >
            Explorar receitas
          </Link>

        </div>
      </section>

      {/* Pesquisa de receitas */}
      <SearchForm />
      
      {/* Apresentação das categorias */}
      <section
        id="categorias"
        className="mx-auto max-w-7xl px-6 py-20"
      >
        <div className="mb-10">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Descubra possibilidades
          </span>

          <h2 className="mt-2 text-3xl font-bold">
            O que você gostaria de preparar?
          </h2>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Encontre inspiração para sua próxima experiência na cozinha.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <article
              key={category.name}
              className="rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-3xl"
                aria-hidden="true"
              >
                {category.emoji}
              </span>

              <h3 className="mt-5 text-lg font-bold">
                {category.name}
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                {category.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Apresentação do caderno */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-muted p-8 md:flex-row md:items-center md:p-12">

          <div>
            <span className="text-3xl" aria-hidden="true">
              📖
            </span>

            <h2 className="mt-4 text-2xl font-bold">
              Suas receitas, suas descobertas.
            </h2>

            <p className="mt-3 max-w-xl text-muted-foreground">
              Guarde suas receitas favoritas, registre avaliações
              e faça anotações para suas próximas experiências.
            </p>
          </div>

          <Link
            href="/cookbook"
            className="shrink-0 rounded-full bg-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Conhecer meu caderno
          </Link>

        </div>
      </section>
    </div>
  );
}
