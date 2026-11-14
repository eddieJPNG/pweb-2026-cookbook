import type { NextRequest } from "next/server";
import {
  findCookbookByMealId,
  insertCookbookEntry,
  listCookbookEntries,
} from "@/lib/db";
import { getMealDetail, MealDbError } from "@/lib/mealdb";

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Aceita JSON e também formulário (form-urlencoded / multipart) */
async function readBody(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const data: unknown = await request.json();
      return typeof data === "object" && data !== null && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;
    }

    const form = await request.formData();
    const body: Record<string, unknown> = {};
    form.forEach((value, key) => {
      body[key] = value;
    });
    return body;
  } catch {
    return null;
  }
}

/**
 * GET /api/cookbook — lista os registros locais.
 */
export async function GET() {
  return Response.json(listCookbookEntries());
}

/**
 * POST /api/cookbook — inclui uma receita no caderno.
 * Corpo inválido → 400; meal_id duplicado → 409; sucesso → 201.
 * `name` e `image_url` vêm da API externa; `created_at` é preenchido pelo backend.
 */
export async function POST(request: NextRequest) {
  const body = await readBody(request);
  if (!body) {
    return error("Corpo da requisição inválido.", 400);
  }

  const mealId = typeof body.meal_id === "string" ? body.meal_id.trim() : "";
  if (mealId === "") {
    return error("Informe o campo meal_id.", 400);
  }

  const rawRating = body.rating;
  const rating =
    typeof rawRating === "number"
      ? rawRating
      : typeof rawRating === "string" && rawRating.trim() !== ""
        ? Number(rawRating)
        : Number.NaN;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return error("O campo rating deve ser um número inteiro de 1 a 5.", 400);
  }

  const rawNote = body.note;
  let note: string | null = null;
  if (rawNote !== undefined && rawNote !== null && rawNote !== "") {
    if (typeof rawNote !== "string" || rawNote.length > 500) {
      return error("O campo note deve ser um texto de até 500 caracteres.", 400);
    }
    note = rawNote;
  }

  if (findCookbookByMealId(mealId)) {
    return error("Receita já existente no caderno.", 409);
  }

  let summary: { name: string; image_url: string };
  try {
    const detail = await getMealDetail(mealId);
    if (!detail) {
      return error("Receita inexistente na TheMealDB.", 404);
    }
    summary = detail;
  } catch (cause) {
    if (cause instanceof MealDbError) {
      return error(
        "Falha ao consultar a TheMealDB. Tente novamente mais tarde.",
        502,
      );
    }
    throw cause;
  }

  const entry = insertCookbookEntry({
    meal_id: mealId,
    name: summary.name,
    image_url: summary.image_url,
    rating,
    note,
  });

  return Response.json(entry, { status: 201 });
}
