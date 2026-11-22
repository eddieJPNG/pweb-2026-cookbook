"use client";

import { updateEntry } from "@/app/cookbook/actions";
import { RatingForm } from "../RatingForm";

interface EditClientProps {
  entry: {
    id: number;
    name: string;
    image_url: string;
    rating: number;
    note: string | null;
  };
}

export function EditClient({ entry }: EditClientProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-6 max-w-2xl">
      <img
        src={entry.image_url}
        alt={entry.name}
        className="w-full h-48 object-cover rounded-xl mb-6"
      />
      <h2 className="text-2xl font-bold mb-1">{entry.name}</h2>

      <RatingForm
        initialRating={entry.rating}
        initialNote={entry.note}
        onSubmit={(data) => updateEntry(entry.id, data)}
      />
    </article>
  );
}
