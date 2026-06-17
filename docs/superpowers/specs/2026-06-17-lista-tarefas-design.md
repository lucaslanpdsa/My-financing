# Lista de Tarefas — Design

**Data:** 2026-06-17
**Status:** Aprovado

## Objetivo

Nova aba "Tarefas" onde o usuário cria **grupos nomeáveis** (ex: "Tarefas diárias",
"Tarefas de longo prazo", "Tarefas para X objetivo") e gerencia **tarefas** dentro
deles com CRUD completo. Cada tarefa tem título, descrição, estado de conclusão,
prazo e prioridade. O usuário pode alternar entre 3 layouts de visualização.

## Modelo de dados (Supabase)

Duas tabelas novas, ambas com RLS ativado e políticas restritas a `user_id = auth.uid()`
(mesmo padrão de `parcelas` / `orcamento_items`).

### `tarefa_grupos`
| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | `default gen_random_uuid()` |
| user_id | uuid | dono (RLS) |
| nome | text not null | nome livre do grupo |
| created_at | timestamptz default now() | ordenação |

### `tarefas`
| coluna | tipo | notas |
|---|---|---|
| id | uuid PK | `default gen_random_uuid()` |
| user_id | uuid | dono (RLS) |
| grupo_id | uuid | FK → `tarefa_grupos(id)` `ON DELETE CASCADE` |
| titulo | text not null | obrigatório |
| descricao | text | opcional |
| concluida | boolean default false | |
| prazo | date | opcional |
| prioridade | text default 'media' | check em ('baixa','media','alta') |
| created_at | timestamptz default now() | ordenação |

Apagar um grupo apaga em cascata suas tarefas.

## Arquitetura (Angular)

Segue o padrão da feature de Despesas: serviço com signals + componente container
+ subcomponentes reutilizáveis.

- **`core/tasks.service.ts` (`TasksService`)**: signals `grupos` e `tarefas`;
  `loadAll(userId)`; CRUD: `addGrupo / renameGrupo / removeGrupo` e
  `addTarefa / updateTarefa / toggleConcluida / removeTarefa`. Computed `tarefasDoGrupo(id)`.
- **`features/tarefas/tarefas.component.ts` (`TarefasComponent`)**: container. Signal
  `layout` (`'colunas' | 'lista' | 'acordeao'`) persistido em `localStorage`. Carrega
  dados no `ngOnInit` com `waitForAuth()` + `currentUser().id`.
- Subcomponentes (usados pelos 3 layouts, sem duplicar lógica):
  - **`TarefaItemComponent`**: uma tarefa — checkbox concluída, título, descrição,
    badge de prioridade, prazo, botões editar/excluir. Edição **inline**.
  - **`TarefaFormComponent`**: formulário criar/editar tarefa (título, descrição,
    prazo, prioridade).
  - **`GrupoHeaderComponent`**: nome do grupo + renomear + excluir + "nova tarefa".

## Layouts (seletor no topo, mesmos dados)

- **Colunas (kanban):** cada grupo é uma coluna lado a lado.
- **Lista lateral:** sidebar com grupos; clicar seleciona e mostra tarefas ao lado.
- **Acordeão:** grupos empilhados na vertical, expandem/recolhem.

Escolha salva em `localStorage` (sem coluna no banco).

## Roteamento e navegação

- Rota `/tarefas` (lazy, `authGuard`) em `app.routes.ts`.
- Link "Tarefas" no `TopbarComponent` (aparece em todas as páginas).
- Card de atalho "Tarefas" na Home, seguindo os cards existentes.

## Testes

Vitest, seguindo o padrão do projeto: unit do `TasksService` com Supabase mockado;
specs de render dos componentes com `AuthService` mockado.

## Fora de escopo (YAGNI)

Sem subtarefas, sem reordenação por drag-and-drop, sem compartilhamento entre
usuários, sem anexos, sem lembretes/notificações.
