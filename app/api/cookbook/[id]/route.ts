import type { NextRequest } from "next/server";
import {
  deleteCookbookEntry,
  updateCookbookEntry,
} from "@/lib/db";

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

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

/**
 * PATCH /api/cookbook/[id] — edita apenas `rating` (1–5) e `note` (≤ 500 chars).
 * Campo inválido → 400; id inexistente → 404.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entryId = parseId(id.trim());
  if (entryId === null) {
    return error("Identificador do caderno inválido.", 400);
  }

  const body = await readBody(request);
  if (!body) {
    return error("Corpo da requisição inválido.", 400);
  }

  const hasRating = body.rating !== undefined;
  const hasNote = body.note !== undefined;
  if (!hasRating && !hasNote) {
    return error("Informe ao menos um campo: rating ou note.", 400);
  }

  const patch: { rating?: number; note?: string | null } = {};

  if (hasRating) {
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
    patch.rating = rating;
  }

  if (hasNote) {
    const rawNote = body.note;
    if (rawNote === null || rawNote === undefined || rawNote === "") {
      patch.note = null;
    } else if (typeof rawNote === "string" && rawNote.length <= 500) {
      patch.note = rawNote;
    } else {
      return error(
        "O campo note deve ser um texto de até 500 caracteres ou null.",
        400,
      );
    }
  }

  const updated = updateCookbookEntry(entryId, patch);
  if (!updated) {
    return error("Receita não encontrada no caderno.", 404);
  }

  return Response.json(updated);
}

/**
 * DELETE /api/cookbook/[id] — remove o registro.
 * Sucesso → 204 (sem corpo); inexistente → 404.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entryId = parseId(id.trim());
  if (entryId === null) {
    return error("Identificador do caderno inválido.", 400);
  }

  if (!deleteCookbookEntry(entryId)) {
    return error("Receita não encontrada no caderno.", 404);
  }

  return new Response(null, { status: 204 });
}
