# Design: Home Page, Rotas e Header Compartilhado

**Data:** 2026-06-02
**Status:** Aprovado

---

## Objetivo

Criar uma home page de entrada que apresente as funcionalidades do app de forma atraente, corrigir os nomes das rotas para refletir o conteúdo de cada tela, e extrair o topbar duplicado para um componente compartilhado que inclua logout em todas as telas.

---

## Rotas

| Rota antes | Rota depois | Componente |
|---|---|---|
| _(não existia)_ | `/` | `HomeComponent` |
| `/dashboard` | `/financiamento` | `DashboardComponent` (pasta mantida) |
| `/despesas` | `/despesas` | `DespesasComponent` |
| `/auth` | `/auth` | `AuthComponent` |
| `**` → `/dashboard` | `**` → `/` | — |

- Todas as rotas exceto `/auth` são protegidas por `authGuard`.
- `authRedirectGuard` (em `/auth`) redireciona para `/` quando o usuário já está logado.

---

## TopbarComponent (compartilhado)

**Localização:** `src/app/shared/components/topbar/topbar.component.ts`

Componente standalone que substitui o bloco `<div class="topbar">` duplicado em `DashboardComponent` e `DespesasComponent`.

### Comportamento

- Usa `Router` e `NavigationEnd` (ou `RouterLinkActive`) para destacar o link ativo.
- Exibe email do usuário via `AuthService.currentUser()?.email`.
- Botão "Sair" chama `AuthService.logout()` em todas as telas.

### Template (estrutura)

```
◆ FINANCIAMENTO    [Home] [Financiamento] [Despesas & Receitas]    user@email  [Sair]
```

Nav links:
- `Home` → `/`
- `Financiamento` → `/financiamento`
- `Despesas & Receitas` → `/despesas`

Classes CSS existentes reutilizadas: `.topbar`, `.topbar-logo`, `.topbar-nav`, `.nav-link`, `.nav-link--active`, `.topbar-right`, `.user-email`, `.btn-logout`.

O `routerLinkActive="nav-link--active"` do Angular detecta o link ativo automaticamente.

---

## HomeComponent

**Localização:** `src/app/features/home/home.component.ts`

### Template

```
<app-topbar />

<div class="home-content">
  <div class="home-header">
    <p class="home-greeting">Olá, {{ email }}</p>
    <p class="home-sub">Escolha uma área para acessar.</p>
  </div>

  <div class="home-cards">
    <a routerLink="/financiamento" class="feature-card">
      <span class="feature-card-icon">◆</span>
      <h2 class="feature-card-title">Financiamento</h2>
      <p class="feature-card-desc">
        Acompanhe seu financiamento: parcelas, juros pagos,
        saldo devedor e a evolução ao longo do tempo.
      </p>
      <span class="feature-card-cta">Acessar →</span>
    </a>

    <a routerLink="/despesas" class="feature-card">
      <span class="feature-card-icon">◆</span>
      <h2 class="feature-card-title">Despesas & Receitas</h2>
      <p class="feature-card-desc">
        Planeje suas receitas e despesas fixas mensais
        e visualize seu saldo disponível.
      </p>
      <span class="feature-card-cta">Acessar →</span>
    </a>
  </div>
</div>
```

### Estilos (home.component.scss)

Todos os valores usam variáveis CSS existentes do projeto.

```scss
.home-content {
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 24px;
}

.home-header {
  margin-bottom: 36px;
}

.home-greeting {
  font-size: 20px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 6px;
}

.home-sub {
  font-size: 13px;
  color: var(--muted);
}

.home-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .home-cards { grid-template-columns: 1fr; }
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  text-decoration: none;
  color: var(--text);
  transition: box-shadow 0.15s, transform 0.15s;
  cursor: pointer;
}

.feature-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  transform: translateY(-2px);
  border-color: var(--border2);
}

.feature-card-icon {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--accent);
}

.feature-card-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--text);
}

.feature-card-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
  flex: 1;
}

.feature-card-cta {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
  font-family: var(--mono);
  margin-top: 4px;
}
```

---

## Arquivos Novos

```
src/app/
  features/
    home/
      home.component.ts
      home.component.html
      home.component.scss
  shared/
    components/
      topbar/
        topbar.component.ts
        topbar.component.html
```

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/app/app.routes.ts` | Adiciona `/`, renomeia `/dashboard` → `/financiamento`, `**` → `/` |
| `src/app/core/auth-redirect.guard.ts` | Redireciona para `/` ao invés de `/dashboard` |
| `src/app/features/dashboard/dashboard.component.html` | Substitui bloco topbar por `<app-topbar />` |
| `src/app/features/dashboard/dashboard.component.ts` | Importa `TopbarComponent`, remove `AuthService` e `logout()` |
| `src/app/features/despesas/despesas.component.html` | Substitui bloco topbar por `<app-topbar />` |
| `src/app/features/despesas/despesas.component.ts` | Importa `TopbarComponent`, adiciona `AuthService` e `logout()` via topbar |

---

## Fora do Escopo

- Renomear a pasta `dashboard/` para `financiamento/` (custo alto, sem benefício visível ao usuário)
- Animações de entrada nos cards da home
- Estatísticas resumidas na home (ex: saldo devedor, saldo de despesas)
- Menu mobile / hamburger
