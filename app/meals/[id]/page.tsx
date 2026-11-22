import { Suspense } from "react";

import MealDetailPageClient from "./_meal-detail-page";

function MealDetailSkeleton() {
  return (
    <div className="px-6 py-20 text-center">
      <p className="text-muted-foreground">
        Carregando detalhes da receita...
      </p>
    </div>
  );
}

export default function MealDetailPage() {
  return (
    <Suspense fallback={<MealDetailSkeleton />}>
      <MealDetailPageClient />
    </Suspense>
  );
}
