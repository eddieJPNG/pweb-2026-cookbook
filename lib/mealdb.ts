const BASE_URL = "https://www.themealdb.com/api/json/v1/1";
const REQUEST_TIMEOUT_MS = 5000;
const MAX_INGREDIENTS = 20;

// FORMATO DA API (CRU)

interface MealDbRecord {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string; // só em search
  strArea?: string;
  strInstructions?: string;
  [key: string]: string | null | undefined;
}

interface MealDbResponse {
  meals: MealDbRecord[] | null;
}

// FORMATO DO BACKEND EM JSON

export interface MealSummary {
  id: string;
  name: string;
  image_url: string;
  category: string | null;
  area: string | null;
}

export interface MealIngredient {
  ingredient: string;
  measure: string;
}

export interface MealDetail {
  id: string;
  name: string;
  image_url: string;
  category: string;
  area: string;
  ingredients: MealIngredient[];
  steps: string[];
}

export interface MealFilters {
  categories: string[];
  areas: string[];
}

export type MealSearchCriteria =
  | { name: string }
  | { category: string }
  | { area: string };

// ERROS

export class MealDbError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "MealDbError";
  }
}

// FETCHS

async function fetchMealDb<T>(path: string) {
  try {
    const response = await fetch(`${BASE_URL}/${path}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (cause) {
    // rede fora, timeout, erros 400 e 500, Json fora de padrão
    throw new MealDbError(`Falha ao consultar a TheMealDB: ${path}`, { cause });
  }
}

// NORMALIZAÇÃO

function toSummary(
  record: MealDbRecord,
  known: { category?: string; area?: string } = {},
): MealSummary {
  return {
    id: record.idMeal,
    name: record.strMeal,
    image_url: record.strMealThumb,
    category: record.strCategory ?? known.category ?? null,
    area: record.strArea ?? known.area ?? null,
  };
}

function parseIngredients(record: MealDbRecord): MealIngredient[] {
  const items: MealIngredient[] = [];
  for (let i = 1; i <= MAX_INGREDIENTS; i++) {
    const ingredient = record[`strIngredient${i}`]?.trim() ?? "";
    const measure = record[`strMeasure${i}`]?.trim() ?? "";
    if (ingredient !== "") {
      items.push({ ingredient, measure });
    }
  }
  return items;
}

function splitInstructions(text: string): string[] {
  const paragraphs = text
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");
  if (paragraphs.length > 1) return paragraphs;

  // FALLBACK

  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

function toDetail(record: MealDbRecord): MealDetail {
  return {
    id: record.idMeal,
    name: record.strMeal,
    image_url: record.strMealThumb,
    category: record.strCategory ?? "",
    area: record.strArea ?? "",
    ingredients: parseIngredients(record),
    steps: splitInstructions(record.strInstructions ?? ""),
  };
}

// funções paras rotas

export async function searchMeals(criteria:MealSearchCriteria, ): Promise<MealSummary[]> {
  if ("name" in criteria) {
    const data = await fetchMealDb<MealDbResponse>(
      `search.php?s=${encodeURIComponent(criteria.name)}`
    ) 
    return (data.meals ?? []).map((m) => toSummary(m));
  }

  if ("category" in criteria) {
    const data = await fetchMealDb<MealDbResponse>(
      `filter.php?c=${encodeURIComponent(criteria.category)}`,
    );
    // o registro não traz strCategory, mas o critério É a categoria:
    return (data.meals ?? []).map((m) =>
      toSummary(m, { category: criteria.category }),
    );
  }

  const data = await fetchMealDb<MealDbResponse>(
    `filter.php?a=${encodeURIComponent(criteria.area)}`,
  );
  return (data.meals ?? []).map((m) => toSummary(m, { area: criteria.area }));
}

export async function getMealDetail(id: string): Promise<MealDetail | null> {
  const data = await fetchMealDb<MealDbResponse>(
    `lookup.php?i=${encodeURIComponent(id)}`,
  );
  const record = data.meals?.[0];
  if (!record) return null; // id válido mas inexistente → 404 na Fase 3
  return toDetail(record);
}

export async function getFilters(): Promise<MealFilters> {
  const [categoriesRes, areasRes] = await Promise.all([
    fetchMealDb<{ meals: { strCategory: string }[] | null }>("list.php?c=list"),
    fetchMealDb<{ meals: { strArea: string }[] | null }>("list.php?a=list"),
  ]);

  return {
    categories: (categoriesRes.meals ?? []).map((c) => c.strCategory),
    areas: (areasRes.meals ?? []).map((a) => a.strArea),
  };
}
  
