"use client";

import { deleteEntry } from "./actions";

export default function DeleteButton({ id }: { id: number }) {
  return (
    <button
      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-red-700"
      onClick={async () => {
        if (window.confirm("Tem certeza que deseja excluir esta receita do caderno?")) {
          await deleteEntry(id);
        }
      }}
    >
      Excluir
    </button>
  );
}
