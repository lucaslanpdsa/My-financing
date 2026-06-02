# Design: Migração para Angular 19 Standalone + Signals

**Data:** 2026-06-02  
**Status:** Aprovado  
**Autor:** Lucas

---

## Contexto

A aplicação atual é um único `index.html` (~667 linhas) com HTML, CSS inline e JavaScript vanilla, integrado ao Supabase (auth + banco de dados) e Chart.js. Possui 20 testes E2E com Playwright.

O objetivo é migrar para Angular 19 seguindo boas práticas, sem alterar o visual, a lógica de negócio ou as integrações existentes.

---

## Abordagem Escolhida

**Angular 19 Standalone Components + Signals**

- Componentes standalone (sem NgModules) — padrão moderno do Angular 17+
- Estado reativo com Angular Signals nativos — sem NgRx
- CSS portado diretamente do original (variáveis CSS preservadas)
- Chaves do Supabase movidas para `environment.ts`
- Testes unitários com Jest + E2E com Playwright (mantido)

---

## Convenção de Arquivos por Componente

Cada componente usa **3 arquivos separados** — sem `template` ou `styles` inline no `.ts`:

```typescript
@Component({
  selector: 'app-parcelas-table',
  standalone: true,
  templateUrl: './parcelas-table.component.html',  // ← HTML separado
  styleUrl:    './parcelas-table.component.scss',  // ← SCSS separado
})
```

## Estrutura de Pastas

```
src/
  app/
    core/
      supabase.service.ts
      auth.service.ts
      financing.service.ts
    features/
      auth/
        auth.component.ts
        auth.component.html
        auth.component.scss
        auth.component.spec.ts
      dashboard/
        dashboard.component.ts
        dashboard.component.html
        dashboard.component.scss
        dashboard.component.spec.ts
        components/
          config-bar/
            config-bar.component.ts
            config-bar.component.html
            config-bar.component.scss
            config-bar.component.spec.ts
          juros-box/
            juros-box.component.ts
            juros-box.component.html
            juros-box.component.scss
            juros-box.component.spec.ts
          kpis/
            kpis.component.ts
            kpis.component.html
            kpis.component.scss
            kpis.component.spec.ts
          progress-bar/
            progress-bar.component.ts
            progress-bar.component.html
            progress-bar.component.scss
            progress-bar.component.spec.ts
          charts/
            charts.component.ts
            charts.component.html
            charts.component.scss
            charts.component.spec.ts
          parcelas-table/
            parcelas-table.component.ts
            parcelas-table.component.html
            parcelas-table.component.scss
            parcelas-table.component.spec.ts
    shared/
      pipes/
        fmt-currency.pipe.ts
        fmt-currency.pipe.spec.ts
    app.component.ts
    app.component.html
    app.component.scss
    app.routes.ts
    app.config.ts
  environments/
    environment.ts
    environment.development.ts
  styles.scss                     ← variáveis CSS globais, reset, classes utilitárias
```

---

## Estado com Signals

```typescript
// auth.service.ts
currentUser = signal<User | null>(null);
isLoading = signal<boolean>(false);

// financing.service.ts
parcelas = signal<Parcela[]>([]);
config = signal<FinancingConfig>({ total: 36, valor: 795.18, financiado: 20000 });
saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

// computed — derivados automaticamente, sem subscriptions manuais
parcelasPagas   = computed(() => this.parcelas().filter(p => p.paga));
parcelasAbertas = computed(() => this.parcelas().filter(p => !p.paga));
totalPago       = computed(() => this.parcelasPagas().reduce((s, p) => s + p.valorPago, 0));
totalFaltando   = computed(() => this.parcelasAbertas().reduce((s, p) => s + p.valor, 0));
percentualPago  = computed(() => {
  const total = this.parcelas().length;
  return total ? Math.round(this.parcelasPagas().length / total * 100) : 0;
});
```

---

## Roteamento e Guards

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'auth',      component: AuthComponent,      canActivate: [authRedirectGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: '**',        redirectTo: 'dashboard' }
];

// authGuard — redireciona para /auth se não logado
// authRedirectGuard — redireciona para /dashboard se já logado
```

---

## Segurança

- Chaves Supabase saem do HTML para `environment.ts` — não expostas diretamente no bundle de produção (tree-shaken)
- Senha hardcoded nos testes Playwright movida para `.env` do Playwright (`process.env.TEST_EMAIL`, `process.env.TEST_PASS`)
- `.env` adicionado ao `.gitignore`
- RLS do Supabase já garante isolamento por `user_id` — não muda

---

## Testes

### Unitários (Jest)

| Arquivo | O que testa |
|---|---|
| `fmt-currency.pipe.spec.ts` | Formatação de valores monetários |
| `auth.service.spec.ts` | Signals de estado, chamadas ao Supabase mockadas |
| `financing.service.spec.ts` | Computed signals, lógica de init/upsert |
| `juros-box.component.spec.ts` | Cálculo de juros, taxa mensal/anual |
| `kpis.component.spec.ts` | Totais, percentual de progresso |
| `config-bar.component.spec.ts` | Validação de inputs, emit de config |
| `parcelas-table.component.spec.ts` | Toggle, edição de valor/data |

### E2E (Playwright)

Todos os 20 testes existentes são mantidos. Seletores (`#auth-screen`, `#app-content`, `.pill.pg`, etc.) são preservados via atributos `id` e `class` nos componentes Angular — minimizando reescrita dos testes.

Credenciais migradas para `.env`:
```
TEST_EMAIL=lucasnascimento094@hotmail.com
TEST_PASS=...
```

---

## O que NÃO muda

- CSS completo (variáveis `--bg`, `--accent`, `--border`, etc.) portado para `styles.scss`
- Fontes Google (DM Mono + Sora)
- Lógica de negócio: `dtSort`, `getMesKey`, `getMesLabel`, cálculo de juros
- Integração Supabase: mesmas tabelas (`financiamento_config`, `parcelas`), mesmas queries
- Comportamento do Chart.js (destroy + recreate no update)
- Visual idêntico ao original

---

## O que muda (somente o necessário)

| Antes | Depois | Motivo |
|---|---|---|
| `index.html` único | Componentes Angular | Estrutura do framework |
| `const sb = createClient(...)` global | `SupabaseService` com `inject()` | Injeção de dependência |
| `innerHTML +=` para renderizar tabela | Template Angular com `@for` | Reatividade |
| `onclick="fn()"` inline | `(click)="fn()"` no template | Padrão Angular |
| Chaves Supabase no HTML | `environment.ts` | Segurança |
| Senha no teste | `.env` | Segurança |
| Sem testes unitários | Jest | Boas práticas |

---

## Não está no escopo

- Redesign visual
- Novas funcionalidades
- Mudança de banco de dados ou auth provider
- SSR / Server-side rendering
- PWA / offline support
