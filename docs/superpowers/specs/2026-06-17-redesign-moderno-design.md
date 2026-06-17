# Redesign Moderno — design

**Data:** 2026-06-17
**Status:** Aprovado

## Objetivo

Modernizar o visual (hoje "retrô": paleta creme, fonte monoespaçada, cards chapados)
para uma base **minimalista limpa (tipo Jira) com pitadas do ClickUp** (cor com
propósito), acento **índigo**, **tema claro/escuro** com toggle e fonte **Inter**.
Sem mudar estrutura de telas nem lógica — é trabalho de tokens/CSS + um ThemeService.

## Tipografia

- **Inter** (400/500/600/700) em toda a UI, carregada no `index.html`. Remove DM Mono e Sora.
- `font-variant-numeric: tabular-nums` no `body` para alinhar valores (substitui o papel da mono).

## Tokens de cor (CSS variables)

Dois conjuntos: claro em `:root`, escuro em `[data-theme="dark"]`.

Chrome de UI (nav, botões, foco, links, progresso) usa `--accent` (índigo).
Valores financeiros positivos/pagos preservam **verde** via `--pos` (semântica de dinheiro).

| token | Claro | Escuro |
|---|---|---|
| --bg | #f6f7f9 | #0c0e12 |
| --surface | #ffffff | #15181e |
| --surface-2 | #f1f3f5 | #1b1f27 |
| --border | #e6e8eb | #262b33 |
| --border2 | #d7dbe0 | #333a44 |
| --text | #0f1419 | #eceef2 |
| --muted | #697077 | #9aa1ac |
| --accent | #4f46e5 | #6366f1 |
| --accent2 | #4338ca | #818cf8 |
| --accent-light | #eef2ff | rgba(99,102,241,.16) |
| --accent-strong | #3730a3 | #c7d2fe |
| --pos | #16a34a | #34d399 |
| --pos-light | #dcfce7 | rgba(52,211,153,.16) |
| --pos-strong | #15803d | #6ee7b7 |
| --warn | #b45309 | #fbbf24 |
| --red | #dc2626 | #f87171 |

Mais: `--shadow-sm/--shadow/--shadow-lg` (sombras sutis, mais fortes no escuro) e
`--ring` (anel de foco índigo translúcido).

## Tema claro/escuro

- **`ThemeService`** (`core/theme.service.ts`): signal `theme` (`'light'|'dark'`),
  `toggle()`, persiste em `localStorage`, default por `prefers-color-scheme`. Aplica
  `data-theme` no `<html>`.
- Injetado no **`App`** (root) para aplicar o tema desde o início, em qualquer rota
  (inclusive a tela de auth, que não tem topbar).
- **Botão de toggle** (sol/lua) no `TopbarComponent`, visível em todas as páginas.

## Modernização visual (sem re-layout)

- Cards (`.kpi`, `.juros-box`, `.chart-card`, `.table-wrap`, `.config-bar`, `.auth-card`,
  `.prog-wrap`, cards de Tarefas/Home) ganham **sombra sutil** e bordas mais leves.
- Botões/inputs: cantos ~8px, hover polido, **anel de foco índigo** (`--ring`).
- Chips de prioridade/status mantêm cor (toque ClickUp).
- Corrigir cores fixas (`#fff`, `#d4d0c8`, `#1a4731`) → tokens, para o tema escuro funcionar.

## Escopo / risco

- Arquivos: `index.html`, `styles.scss` (tokens + componentes globais), `.scss` de
  componentes (trocar cores fixas), novo `ThemeService`, `app.ts` (injeção), `topbar` (toggle).
- **Não** muda HTML estrutural das telas nem lógica de negócio. Sem mudança de banco.
- Verificação: `ng build` + suíte de testes.

## Fora de escopo (YAGNI)

Sem re-layout das telas, sem novos componentes de UI, sem animações elaboradas,
sem migração de deploy (tratada à parte, quando for monetizar).
