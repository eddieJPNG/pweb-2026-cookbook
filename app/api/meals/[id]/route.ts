import type { NextRequest } from "next/server";
import { getMealDetail, MealDbError } from "@/lib/mealdb";

/**
 * GET /api/meals/[id]
 * id inválido → 400; receita inexistente → 404; falha externa → 502.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const mealId = id.trim();

  if (!/^\d+$/.test(mealId)) {
    return Response.json(
      { error: "Identificador de receita inválido." },
      { status: 400 },
    );
  }

  try {
    const meal = await getMealDetail(mealId);

    if (!meal) {
      return Response.json(
        { error: "Receita não encontrada." },
        { status: 404 },
      );
    }

    return Response.json(meal);
  } catch (cause) {
    if (cause instanceof MealDbError) {
      return Response.json(
        {
          error: "Falha ao consultar a TheMealDB. Tente novamente mais tarde.",
        },
        { status: 502 },
      );
    }
    throw cause;
  }
}
