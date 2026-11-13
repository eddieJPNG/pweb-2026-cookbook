import type { NextRequest } from "next/server";
import { MealDbError, searchMeals } from "@/lib/mealdb";
import type { MealSearchCriteria } from "@/lib/mealdb";

const EXTERNAL_ERROR = {
  error: "Falha ao consultar a TheMealDB. Tente novamente mais tarde.",
} as const;

/**
 * GET /api/meals?name= | category= | area=
 * Exatamente um critério; caso contrário 400.
 * Formato de resposta idêntico para os três casos.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const name = params.get("name")?.trim() ?? "";
  const category = params.get("category")?.trim() ?? "";
  const area = params.get("area")?.trim() ?? "";

  const criteria: MealSearchCriteria[] = [];
  if (name !== "") criteria.push({ name });
  if (category !== "") criteria.push({ category });
  if (area !== "") criteria.push({ area });

  if (criteria.length !== 1) {
    return Response.json(
      {
        error:
          "Informe exatamente um critério de busca: name, category ou area.",
      },
      { status: 400 },
    );
  }

  try {
    const meals = await searchMeals(criteria[0]);
    return Response.json(meals);
  } catch (cause) {
    if (cause instanceof MealDbError) {
      return Response.json(EXTERNAL_ERROR, { status: 502 });
    }
    throw cause;
  }
}
