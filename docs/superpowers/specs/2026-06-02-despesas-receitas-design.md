# Design: Despesas & Receitas Fixas

**Data:** 2026-06-02
**Status:** Aprovado

---

## Objetivo

Permitir ao usuário cadastrar suas receitas e despesas fixas mensais e visualizar o saldo restante. Não é um log de transações — é um planejamento de orçamento fixo.

---

## Navegação

O topbar recebe dois links de navegação:

- `Financiamento` → `/dashboard`
- `Despesas & Receitas` → `/despesas`

Link ativo destacado com `color: var(--accent)`. Logo e botão Sair permanecem inalterados.

---

## Rota

- `/despesas` → `DespesasComponent` protegido por `authGuard`
- `**` continua redirecionando para `/dashboard`

---

## UI — Tela `/despesas`

Duas colunas lado a lado (responsivo: empilha em mobile):

```
[ Receitas Fixas ]          [ Despesas Fixas ]
  Salário   R$5.000          Aluguel   R$1.500
  Freelance R$1.200          Internet  R$120
  + Adicionar                + Adicionar

  Total: R$6.200             Total: R$1.800

─────────────────────────────────────────────
Saldo restante: R$4.400
```

Cada item da lista tem:
- Nome
- Valor (formatado com `FmtCurrencyPipe`)
- Botão de remover (×)

Formulário inline de adição (sem modal): campo nome + campo valor + botão confirmar.

---

## Modelo de Dados

### Supabase — tabela `orcamento_items`

```sql
CREATE TABLE orcamento_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo       text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  nome       text NOT NULL,
  valor      numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orcamento_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own items"
  ON orcamento_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Arquitetura Angular

### Novos arquivos

```
src/app/
  core/
    budget.service.ts               ← signals: items, computed totals; CRUD Supabase
    budget.service.spec.ts
  features/
    despesas/
      despesas.component.ts
      despesas.component.html
      despesas.component.scss
      despesas.component.spec.ts
      components/
        budget-column/
          budget-column.component.ts    ← coluna reutilizável (receitas ou despesas)
          budget-column.component.html
          budget-column.component.scss
          budget-column.component.spec.ts
```

### Arquivos modificados

- `src/app/app.routes.ts` — adiciona rota `/despesas`
- `src/app/features/dashboard/dashboard.component.html` — topbar com links de navegação
- `src/app/features/dashboard/dashboard.component.ts` — importa `RouterLink`

### BudgetService (signals)

```typescript
items = signal<BudgetItem[]>([]);

receitas  = computed(() => items().filter(i => i.tipo === 'receita'));
despesas  = computed(() => items().filter(i => i.tipo === 'despesa'));
totalReceitas = computed(() => receitas().reduce((s, i) => s + i.valor, 0));
totalDespesas = computed(() => despesas().reduce((s, i) => s + i.valor, 0));
saldo         = computed(() => totalReceitas() - totalDespesas());
```

---

## O que fica fora do escopo

- Marcar item como pago no mês
- Histórico mensal
- Categorias predefinidas
- Variação de valor por mês

---

## Fora do escopo também

- Tela de configuração de orçamento (edição inline já resolve)
- Relatórios ou gráficos (pode entrar depois)
