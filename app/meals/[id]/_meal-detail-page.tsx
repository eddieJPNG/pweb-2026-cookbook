"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  getMealDetail,
  type MealDetail,
} from "@/lib/api";
import { RatingForm } from "@/app/cookbook/RatingForm";

export default function MealDetailPageClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Busca os detalhes da receita ao abrir a página.
  useEffect(() => {
    let active = true;

    async function loadMeal() {
      try {
        setLoading(true);
        setError("");

        const data = await getMealDetail(id);

        if (active) {
          setMeal(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Não foi possível carregar a receita."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMeal();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-muted-foreground">Carregando detalhes da receita...</p>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Não foi possível carregar a receita</h1>
        <p className="mt-3 text-muted-foreground">{error || "Receita não encontrada."}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dark"
        >
          Voltar para receitas
        </Link>
      </section>
    );
  }

  const handleAddToCookbook = (data: { rating: number; note: string | null }) => {
    // Envia para a API de caderno
    fetch("/api/cookbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meal_id: meal.id,
        name: meal.name,
        image_url: meal.image_url,
        rating: data.rating,
        note: data.note,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Falha ao adicionar ao caderno.");
        }
        return response.json();
      })
      .then(() => {
        setShowAddForm(false);
        alert("Receita adicionada ao seu caderno com sucesso!");
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-semibold text-primary hover:underline"
      >
        ← Voltar para receitas
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Informações principais */}
        <div>
          <img
            src={meal.image_url}
            alt={meal.name}
            className="w-full rounded-2xl object-cover shadow-sm"
          />

          <h1 className="mt-6 text-3xl font-bold">{meal.name}</h1>

          <p className="mt-3 text-muted-foreground">
            {meal.category} · {meal.area}
          </p>

          {/* BOTÃO ADICIONAR AO CADERNBO */}
          <div className="mt-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full rounded-xl bg-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-primary-dark flex items-center justify-center gap-2"
            >
              {showAddForm ? "✕ Fechar formulário" : "➕ Adicionar ao meu caderno"}
            </button>
          </div>

          {showAddForm && (
            <div className="mt-4">
              <RatingForm
                initialRating={0}
                initialNote={null}
                onSubmit={handleAddToCookbook}
              />
            </div>
          )}
        </div>

        {/* Ingredientes */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-2xl font-bold">Ingredientes</h2>
          <ul className="mt-5 space-y-3">
            {meal.ingredients.map((item, index) => (
              <li
                key={index}
                className="flex justify-between gap-4 border-b border-border pb-3"
              >
                <span>{item.ingredient}</span>
                <span className="text-right text-sm text-muted-foreground">
                  {item.measure}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modo de preparo */}
      <div className="mt-12 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <h2 className="text-2xl font-bold">Modo de preparo</h2>
        <ol className="mt-6 space-y-5">
          {meal.steps.map((step, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-primary">
                {index + 1}
              </span>
              <p className="pt-1 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}