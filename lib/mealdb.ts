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

interface MealDbResposnse {
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

export type MealSearchCriiteria =
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


