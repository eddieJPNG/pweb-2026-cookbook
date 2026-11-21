"use client";

import { useState } from "react";

export interface RatingFormProps {
  initialRating?: number;
  initialNote?: string | null;
  onSubmit: (data: { rating: number; note: string | null }) => void;
  submitting?: boolean;
}

export function RatingForm({
  initialRating = 0,
  initialNote = null,
  onSubmit,
  submitting = false,
}: RatingFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (rating < 1 || rating > 5) {
      alert("Selecione uma avaliação de 1 a 5 estrelas.");
      return;
    }

    setSaving(true);
    onSubmit({ rating, note: note.trim() || null });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2">
          Sua avaliação
        </label>
        <div
          className="flex gap-2"
          role="radiogroup"
          aria-label="Avaliação de 1 a 5 estrelas"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-checked={rating === star}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-200 ${
                rating >= star
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface border border-border text-muted-foreground hover:bg-primary-hover"
              }`}
            >
              {star}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Toque em uma estrela para avaliar
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          Sua nota pessoal
        </label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ex.: Dá para replicar o molho; o restante é muito pesado."
          maxLength={500}
          rows={4}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        ></textarea>
        <p className="text-xs text-muted-foreground mt-1">
          {note.length}/500 caracteres
        </p>
      </div>

      <button
        type="submit"
        disabled={saving || submitting || rating < 1}
        className={`w-full rounded-xl px-7 py-3 font-semibold text-white transition-colors ${
          rating < 1 || saving || submitting
            ? "bg-primary opacity-60 cursor-not-allowed"
            : "bg-primary hover:bg-primary-dark"
        }`}
      >
        {saving ? "Salvando..." : "Salvar avaliação"}
      </button>
    </form>
  );
}
