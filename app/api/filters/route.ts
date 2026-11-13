import { getFilters, MealDbError } from "@/lib/mealdb";

/**
 * GET /api/filters
 * Categorias (list.php?c=list) e culinárias (list.php?a=list).
 */
export async function GET() {
  try {
    const filters = await getFilters();
    return Response.json(filters);
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
