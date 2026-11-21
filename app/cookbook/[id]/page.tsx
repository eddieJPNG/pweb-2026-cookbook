import { findCookbookById } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditClient } from "./EditClient";

export const instant = false;

export default async function EditCookbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entryId = Number(id);

  const entry = findCookbookById(entryId);
  if (!entry) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold">✏️ Editar Receita</h1>
        <Link
          href="/cookbook"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          ← Voltar para o caderno
        </Link>
      </div>

      <EditClient entry={entry} />
    </section>
  );
}
