
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cookbook | Livro de Receitas",
  description:
    "Descubra e explore novos sabores, organize suas receitas favoritas.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">

        {/* Cabeçalho compartilhado */}
        <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
          <nav
            className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6"
            aria-label="Navegação principal"
          >
            {/* Identidade da aplicação */}
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Cookbook - Página inicial"
            >
              <span className="text-3xl" aria-hidden="true">
                🍲
              </span>

              <span className="text-2xl font-bold tracking-tight">
                Cook<span className="text-primary">book</span>
              </span>
            </Link>

            {/* Links de navegação */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Explorar receitas
              </Link>

              <Link
                href="/cookbook"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Meu caderno
              </Link>
            </div>
          </nav>
        </header>

        {/* Conteúdo específico de cada página */}
        <main className="flex-1">
          {children}
        </main>

        {/* Rodapé compartilhado */}
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto max-w-7xl px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Cookbook — Descubra, prepare e compartilhe sabores.
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Projeto acadêmico de Programação Web.
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}

