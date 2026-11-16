
"use client";

import { useEffect, useState } from "react";

import {
  getFilters,
  searchMeals,
  type MealFilters,
  type MealSearchCriteria,
  type MealSummary,
} from "@/lib/api";

type SearchType = "name" | "category" | "area";

export default function SearchForm() {
  const [searchType, setSearchType] =
    useState<SearchType>("name");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");

  const [filters, setFilters] = useState<MealFilters>({
    categories: [],
    areas: [],
  });

  const [meals, setMeals] = useState<MealSummary[]>([]);

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Carrega as opções dos filtros quando o componente é montado.
  useEffect(() => {
    async function loadFilters() {
      try {
        const data = await getFilters();
        setFilters(data);
      } catch {
        setError("Não foi possível carregar os filtros.");
      } finally {
        setLoadingFilters(false);
      }
    }

    loadFilters();
  }, []);

  // Executa a pesquisa.
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMeals([]);

    let criteria: MealSearchCriteria;

    if (searchType === "name") {
      const name = searchTerm.trim();

      if (!name) {
        setError("Digite o nome de uma receita.");
        return;
      }

      criteria = { name };
    } else {
      if (!selectedFilter) {
        setError("Selecione uma opção para pesquisar.");
        return;
      }

      criteria =
        searchType === "category"
          ? { category: selectedFilter }
          : { area: selectedFilter };
    }
    setHasSearched(true);
    setLoadingSearch(true);

    try {
    const results = await searchMeals(criteria);

setMeals(results);

console.log("Resultados enviados para o estado:", results.length);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro durante a pesquisa."
      );
    } finally {
      setLoadingSearch(false);
    }
  }

  // Define as opções apresentadas no campo de seleção.
  const filterOptions = Array.from(
  new Set(
    searchType === "category"
      ? filters.categories
      : filters.areas
  )
);
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-6 shadow-sm md:p-10">

        <div className="mb-7 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Encontre sua inspiração
          </span>

          <h2 className="mt-3 text-3xl font-bold">
            O que vamos cozinhar hoje?
          </h2>

          <p className="mt-3 text-muted-foreground">
            Pesquise pelo nome, categoria ou culinária.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <label
            htmlFor="search-type"
            className="mb-2 block text-sm font-semibold"
          >
            Como deseja pesquisar?
          </label>

          <select
            id="search-type"
            value={searchType}
            onChange={(event) => {
              setSearchType(event.target.value as SearchType);
              setSearchTerm("");
              setSelectedFilter("");
              setMeals([]);
              setError("");
            }}
            className="mb-5 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="name">Nome da receita</option>
            <option value="category">Categoria</option>
            <option value="area">Culinária</option>
          </select>

          {searchType === "name" ? (
            <>
              <label
                htmlFor="recipe-search"
                className="mb-2 block text-sm font-semibold"
              >
                Nome da receita
              </label>

              <input
                id="recipe-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Ex.: Chicken, Pasta, Beef..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </>
          ) : (
            <>
              <label
                htmlFor="recipe-filter"
                className="mb-2 block text-sm font-semibold"
              >
                {searchType === "category"
                  ? "Selecione uma categoria"
                  : "Selecione uma culinária"}
              </label>

              <select
                id="recipe-filter"
                value={selectedFilter}
                onChange={(event) =>
                  setSelectedFilter(event.target.value)
                }
                disabled={loadingFilters}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <option value="">
                  {loadingFilters
                    ? "Carregando opções..."
                    : "Selecione uma opção"}
                </option>

                {filterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            type="submit"
            disabled={loadingSearch || loadingFilters}
            className="mt-5 w-full rounded-xl bg-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingSearch ? "Pesquisando..." : "Pesquisar receitas"}
          </button>

        </form>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {loadingSearch && (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Buscando receitas...
          </p>
        )}

        {!loadingSearch && meals.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-xl font-bold">
              Resultados encontrados: {meals.length}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {meals.map((meal) => (
                <article
                  key={meal.id}
                  className="overflow-hidden rounded-xl border border-border bg-background"
                >
                  <img
                    src={meal.image_url}
                    alt={meal.name}
                    className="h-48 w-full object-cover"
                  />

                  <div className="p-4">
                    <h4 className="font-bold">{meal.name}</h4>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {meal.category ?? "Categoria não informada"}
                      {" · "}
                      {meal.area ?? "Culinária não informada"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}  
        {!loadingSearch &&
          meals.length === 0 &&
          !error && (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              {hasSearched
                ? "Nenhuma receita encontrada. Experimente outra opção."
                : "Realize uma pesquisa para visualizar as receitas."}
            </p>
          )}
      
      </div>
    </section>
  );
}
