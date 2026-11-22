"use server";

import { deleteCookbookEntry, updateCookbookEntry } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteEntry(id: number) {
  await deleteCookbookEntry(id);
  revalidatePath("/cookbook");
}

export async function updateEntry(
  id: number,
  data: { rating: number; note: string | null }
) {
  updateCookbookEntry(id, data);
  revalidatePath("/cookbook");
  revalidatePath(`/cookbook/${id}`);
}
