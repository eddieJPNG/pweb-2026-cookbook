import { listCookbookEntries, deleteCookbookEntry }  from "@/lib/db";
import { spawn } from "child_process";
import Link from "next/link"
import DeleteButton from "./DeleteButton";

export default function CookbookPage() {
    const entries = listCookbookEntries() 

    return (
        <section className="mx-auto max-w-7xl px-6 py-20">
            <div className="flex items-center justify-between mb-10">
                <h1
                className="text-3xl font-bold"
                >
                    📖 Meu Caderno de Receitas 
                </h1>
                <Link
                 href="/"
                 className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    ← Voltar para Receitas
                </Link>
            </div>

            {
             entries.length === 0 ? (
                <div
                className="text-center py-20"
                >
                    <p
                    className="text-4xl mb-4"
                    >
                        📭
                    </p>
                    <h2
                    className="text-xl font-semibold"
                    >
                        Seu caderno de receitas está vazio
                    </h2>
                    <p
                    className="text-muted-foreground mt-2"
                    >
                        Explore as receitas e adicione suas favoritas aqui.
                    </p>
                </div>
             ) : (
                <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {entries.map((entry) => (
                        <article
                        key={entry.id}
                        className="rounded-2xl border border-border bg-surface p-6 flex flex-col hover:shadow-md transition-shadow"
                        >
                            <img 
                            src={entry.image_url}
                            alt={entry.name}
                             
                            className="w-full h-48 object-cover rounded-xl mb-4"/>

                            <h3
                            className="text-xl font-bold mb-1"
                            >
                                {entry.name}
                            </h3>

                            <div
                            className="flex items-center gap-1 mb-2"
                            >
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                key={star}
                                className="text-xs"
                                aria-hidden="true"
                                >
                                 {entry.rating >= star ? "★" : "☆"}
                                </span>
                              ))}
                              <span
                              className="ml-2 text-sm font-medium text-muted-foreground"
                              >
                                {entry.rating}/5
                              </span>
                            </div>

                            {entry.note && (
                                <p
                                className="text-sm text-muted-foreground mb-4 flex-1 italic"
                                >
                                    "{entry.note}"
                                </p>
                            )}

                            <div
                            className="mt-auto flex gap-2"
                            >
                                <Link
                                href={`/cookbook/${entry.id}`}
                                className="flex-1 bg-primary text-white text-center px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                                >
                                Editar
                                </Link>
                                
                                <DeleteButton id={entry.id} />
                            </div>


                        </article>
                    ))}
                </div>
             )
            }
        </section>
    )
}