
const API_BASE_URL = "/api";

// Representa uma receita apresentada na pesquisa.
export interface MealSummary {
  id: string;
  name: string;
  image_url: string;
  category: string | null;
  area: string | null;
}

// Representa um ingrediente da receita.
export interface MealIngredient {
  ingredient: string;
  measure: string;
}

// Representa os detalhes completos de uma receita.
export interface MealDetail {
  id: string;
  name: string;
  image_url: string;
  category: string;
  area: string;
  ingredients: MealIngredient[];
  steps: string[];
}

// Representa as opções disponíveis nos filtros.
export interface MealFilters {
  categories: string[];
  areas: string[];
}

// Critérios aceitos pelo backend.
export type MealSearchCriteria =
  | { name: string }
  | { category: string }
  | { area: string };

// Função genérica para tratar respostas HTTP.
async function request<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Não foi possível realizar a solicitação."
    );
  }

  return data as T;
}

// Busca as categorias e culinárias disponíveis.
export async function getFilters(): Promise<MealFilters> {
  return request<MealFilters>("/filters");
}

// Pesquisa receitas de acordo com um critério.
export async function searchMeals(
  criteria: MealSearchCriteria
): Promise<MealSummary[]> {
  const params = new URLSearchParams(criteria);

  return request<MealSummary[]>(
    `/meals?${params.toString()}`
  );
}

// Busca os detalhes completos de uma receita pelo ID.
export async function getMealDetail(
  id: string
): Promise<MealDetail> {
  return request<MealDetail>(`/meals/${encodeURIComponent(id)}`);
}