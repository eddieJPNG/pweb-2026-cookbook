# Plano de Implementação — Livro de Receitas (Problema 06)

## Fase 0 — Configuração do projeto
**Pré-requisitos:** nenhum (ponto de partida).

- Inicializar projeto Next.js com App Router e TypeScript.
- Configurar `tsconfig.json` com `"strict": true`.
- Configurar Tailwind CSS (ou CSS puro).
- Instalar `better-sqlite3` (+ `@types/better-sqlite3`).
- Criar `.gitignore` (`node_modules`, `.next`, `data/*.db` e derivados).
- Estrutura base de pastas: `app/`, `app/api/`, `lib/`, `components/`.
- Verificar que `npm install` e `npm run dev` funcionam.

---

## Fase 1 — Camada de dados (SQLite)
**Pré-requisitos:** Fase 0.

- Criar `lib/db.ts`:
  - Abertura do banco em `data/app.db`, criando diretório/arquivo se não existir.
  - **Sem** `PRAGMA journal_mode = WAL` (manter journal padrão `DELETE`).
  - Criação da tabela `cookbook` (`id`, `meal_id`, `name`, `image_url`, `rating`, `note`, `created_at`).
  - Seed de 3–10 registros iniciais com `meal_id`s válidos do TheMealDB, inserido **somente** na criação do banco (checar se a tabela/vazio existe), em local único.
- Definir helpers de consulta com **prepared statements** (sem concatenação de SQL).

---

## Fase 2 — Integração com a API externa (TheMealDB)
**Pré-requisitos:** Fase 1.

- Criar `lib/mealdb.ts` (ou equivalente): cliente `fetch` para `https://www.themealdb.com/api/json/v1/1`.
- Mapear os 3 tipos de busca (`search.php?s=`, `filter.php?c=`, `filter.php?a=`).
- Funções de **conversão** para o formato próprio da aplicação:
  - Lista de ingredientes: extrair pares `strIngredientN`/`strMeasureN`, descartando vazios → `{ ingredient, measure }`.
  - Passos: dividir `strInstructions` em lista de passos.
  - Projeção de campos apenas necessários (id, name, image_url, category, area, etc.).
- Tratamento de falha de rede/API → erro adequado (502 na camada de API).

---

## Fase 3 — Backend: endpoints de consulta (sem banco)
**Pré-requisitos:** Fases 1–2.

- `GET /api/meals?name= | category= | area=`:
  - Validar: **exatamente um** critério → senão `400` com `{ "error": "..." }`.
  - Resposta com formato idêntico para os três casos.
- `GET /api/meals/[id]`:
  - Validar id → `400`; receita inexistente → `404`; falha externa → `502`.
  - Retornar detalhes com ingredientes convertidos e passos.
- `GET /api/filters`: categorias e culinárias (a partir de `list.php?c=list` e `list.php?a=list`).
- Testar todas as rotas (navegador/Insomnia/curl) antes de seguir.

---

## Fase 4 — Backend: CRUD do caderno (`cookbook`)
**Pré-requisitos:** Fases 1–3.

- `GET /api/cookbook`: listar registros locais.
- `POST /api/cookbook`: incluir receita;
  - Validar corpo → `400`; **`meal_id` já existente → `409`**; sucesso → `201`.
  - Buscar dados resumidos (`name`, `image_url`) na API externa para salvar junto.
- `PATCH /api/cookbook/[id]`: editar **apenas** `rating` (1–5) e `note` (≤ 500 chars);
  - Campo inválido → `400`; id inexistente → `404`.
- `DELETE /api/cookbook/[id]`: remover → `204`; inexistente → `404`.
- `created_at` preenchido automaticamente pelo backend.
- Todos os erros no formato único `{ "error": "Mensagem em português" }`.

---

## Fase 5 — Frontend: estrutura e busca
**Pré-requisitos:** Fase 3 (pode iniciar em paralelo à Fase 4).

- Layout raiz (`app/layout.tsx`) com navegação via `<Link>` (Busca / Caderno).
- Página de busca (`app/page.tsx` ou `app/meals/page.tsx`):
  - Formulário acessível com seletor de critério (nome, categoria, culinário) + campo de valor.
  - Buscar exclusivamente em `/api/meals`; categorias/culinárias via `/api/filters`.
- Componentes reutilizáveis com props: `MealCard`, `SearchForm`, estados de **carregamento**, **vazio** e **erro**.

---

## Fase 6 — Frontend: detalhe e caderno
**Pré-requisitos:** Fase 5.

- Página de detalhe `app/meals/[id]/page.tsx`:
  - Imagem, ingredientes (lista `{ingrediente, medida}`), passos, botão "adicionar ao caderno" (`POST /api/cookbook`, tratando `409`).
- Página do caderno `app/cookbook/page.tsx`:
  - Listagem (`GET /api/cookbook`), edição de `rating`/`note` (`PATCH`), remoção (`DELETE`), com feedback de operações assíncronas.
- Tratar erros de rede em todas as telas.

---

## Fase 7 — Qualidade: responsividade e acessibilidade
**Pré-requisitos:** Fases 5–6.

- Layout adaptado a diferentes tamanhos de tela (sem rolagem horizontal, sem sobreposição).
- HTML semântico, formulários/controles acessíveis, foco visível, contraste adequado.
- Revisar textos de interface em português e identificadores técnicos em inglês.

---

## Fase 8 — Requisitos finais e documentação
**Pré-requisitos:** Fases 0–7 completas e funcionais.

- Revisar `.gitignore` e confirmar que `data/app.db` não é versionado.
- Escrever `README.md`: integrantes, descrição, funcionalidades, API externa, tabela de endpoints (método + finalidade), tabela do banco + localização + registros iniciais, tecnologias, versão do Node.js, instruções de execução.
- Verificar checklist: compilação TypeScript sem erros, códigos 400/404/409/502 presentes, seed de 3–10 registros, WAL desativado.
- Commits incrementais na branch `main` e preparação da entrega (SIGAA, até 22/11/2026).
