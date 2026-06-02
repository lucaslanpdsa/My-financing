# Home Page, Rotas e Header Compartilhado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a home page de entrada do app, corrigir os nomes das rotas, extrair o topbar duplicado para um componente compartilhado com logout em todas as telas.

**Architecture:** Um `TopbarComponent` standalone centraliza navegação, email do usuário e logout. Um novo `HomeComponent` na rota `/` serve como landing pós-login. A rota `/dashboard` é renomeada para `/financiamento`. `AuthService` e `authRedirectGuard` são atualizados para apontar para `/` ao invés de `/dashboard`.

**Tech Stack:** Angular 21, Signals, standalone components, RouterLink/RouterLinkActive, SCSS (variáveis CSS globais)

---

## File Map

| Ação | Arquivo |
|---|---|
| **Criar** | `src/app/shared/components/topbar/topbar.component.ts` |
| **Criar** | `src/app/shared/components/topbar/topbar.component.spec.ts` |
| **Criar** | `src/app/features/home/home.component.ts` |
| **Criar** | `src/app/features/home/home.component.html` |
| **Criar** | `src/app/features/home/home.component.scss` |
| **Criar** | `src/app/features/home/home.component.spec.ts` |
| **Modificar** | `src/app/app.routes.ts` |
| **Modificar** | `src/app/core/auth.service.ts` (linha 29) |
| **Modificar** | `src/app/core/auth-redirect.guard.ts` (linha 10) |
| **Modificar** | `src/app/features/dashboard/dashboard.component.ts` |
| **Modificar** | `src/app/features/dashboard/dashboard.component.html` |
| **Modificar** | `src/app/features/dashboard/dashboard.component.spec.ts` |
| **Modificar** | `src/app/features/despesas/despesas.component.ts` |
| **Modificar** | `src/app/features/despesas/despesas.component.html` |

---

## Task 1: TopbarComponent

**Files:**
- Create: `src/app/shared/components/topbar/topbar.component.ts`
- Create: `src/app/shared/components/topbar/topbar.component.spec.ts`

- [ ] **Step 1.1: Write the failing spec**

```typescript
// src/app/shared/components/topbar/topbar.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopbarComponent } from './topbar.component';
import { AuthService } from '../../../core/auth.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

const mockAuth = {
  currentUser: signal({ id: 'u1', email: 'test@test.com' } as any),
  logout: jasmine.createSpy('logout').and.resolveTo(),
};

describe('TopbarComponent', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the logo text', () => {
    const logo = fixture.nativeElement.querySelector('.topbar-logo');
    expect(logo.textContent).toContain('Financiamento');
  });

  it('renders user email', () => {
    const email = fixture.nativeElement.querySelector('#user-email');
    expect(email.textContent.trim()).toBe('test@test.com');
  });

  it('calls logout when Sair is clicked', async () => {
    const btn = fixture.nativeElement.querySelector('.btn-logout');
    btn.click();
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('renders three nav links', () => {
    const links = fixture.nativeElement.querySelectorAll('.nav-link');
    expect(links.length).toBe(3);
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

```
ng test --watch=false
```

Expected: falha com "Cannot find module './topbar.component'"

- [ ] **Step 1.3: Criar TopbarComponent**

```typescript
// src/app/shared/components/topbar/topbar.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="topbar">
      <span class="topbar-logo">◆ Financiamento</span>
      <nav class="topbar-nav">
        <a routerLink="/" routerLinkActive="nav-link--active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">Home</a>
        <a routerLink="/financiamento" routerLinkActive="nav-link--active" class="nav-link">Financiamento</a>
        <a routerLink="/despesas" routerLinkActive="nav-link--active" class="nav-link">Despesas & Receitas</a>
      </nav>
      <div class="topbar-right">
        <span class="user-email" id="user-email">{{ auth.currentUser()?.email }}</span>
        <button class="btn-logout" (click)="logout()">Sair</button>
      </div>
    </div>
  `,
})
export class TopbarComponent {
  readonly auth = inject(AuthService);

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
```

- [ ] **Step 1.4: Run tests to verify eles passam**

```
ng test --watch=false
```

Expected: todos os testes existentes + os novos do `TopbarComponent` passam.

- [ ] **Step 1.5: Commit**

```bash
git add src/app/shared/components/topbar/
git commit -m "feat: add shared TopbarComponent with nav links and logout"
```

---

## Task 2: Corrigir referências a `/dashboard` em auth

**Files:**
- Modify: `src/app/core/auth.service.ts`
- Modify: `src/app/core/auth-redirect.guard.ts`

- [ ] **Step 2.1: Atualizar `auth.service.ts`**

Trocar na linha 29:

```typescript
// antes
if (event === 'SIGNED_IN') this.router.navigate(['/dashboard']);
// depois
if (event === 'SIGNED_IN') this.router.navigate(['/']);
```

- [ ] **Step 2.2: Atualizar `auth-redirect.guard.ts`**

```typescript
// src/app/core/auth-redirect.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

export const authRedirectGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService).client;
  const router = inject(Router);

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return router.createUrlTree(['/']);
  return true;
};
```

- [ ] **Step 2.3: Commit**

```bash
git add src/app/core/auth.service.ts src/app/core/auth-redirect.guard.ts
git commit -m "fix: redirect to / instead of /dashboard after login"
```

---

## Task 3: Atualizar app.routes.ts

**Files:**
- Modify: `src/app/app.routes.ts`

- [ ] **Step 3.1: Escrever a nova configuração de rotas**

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { authRedirectGuard } from './core/auth-redirect.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [authRedirectGuard],
  },
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'financiamento',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'despesas',
    loadComponent: () => import('./features/despesas/despesas.component').then(m => m.DespesasComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
```

- [ ] **Step 3.2: Run tests**

```
ng test --watch=false
```

Expected: testes passam (HomeComponent ainda não existe — o lazy load só falha em runtime, não em compilação).

- [ ] **Step 3.3: Commit**

```bash
git add src/app/app.routes.ts
git commit -m "feat: add / home route, rename /dashboard to /financiamento"
```

---

## Task 4: Criar HomeComponent

**Files:**
- Create: `src/app/features/home/home.component.ts`
- Create: `src/app/features/home/home.component.html`
- Create: `src/app/features/home/home.component.scss`
- Create: `src/app/features/home/home.component.spec.ts`

- [ ] **Step 4.1: Write the failing spec**

```typescript
// src/app/features/home/home.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { AuthService } from '../../core/auth.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

const mockAuth = {
  currentUser: signal({ id: 'u1', email: 'user@test.com' } as any),
  logout: async () => {},
};

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('renders two feature cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.feature-card');
    expect(cards.length).toBe(2);
  });

  it('first card links to /financiamento', () => {
    const cards = fixture.nativeElement.querySelectorAll('.feature-card');
    expect(cards[0].getAttribute('href')).toBe('/financiamento');
  });

  it('second card links to /despesas', () => {
    const cards = fixture.nativeElement.querySelectorAll('.feature-card');
    expect(cards[1].getAttribute('href')).toBe('/despesas');
  });
});
```

- [ ] **Step 4.2: Run test to verify it fails**

```
ng test --watch=false
```

Expected: falha com "Cannot find module './home.component'"

- [ ] **Step 4.3: Criar home.component.ts**

```typescript
// src/app/features/home/home.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TopbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly auth = inject(AuthService);
}
```

- [ ] **Step 4.4: Criar home.component.html**

```html
<!-- src/app/features/home/home.component.html -->
<div id="home-screen">
  <app-topbar />

  <div class="home-content">
    <div class="home-header">
      <p class="home-greeting">Olá, {{ auth.currentUser()?.email }}</p>
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
</div>
```

- [ ] **Step 4.5: Criar home.component.scss**

```scss
// src/app/features/home/home.component.scss
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
  font-family: var(--sans);
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
  .home-cards {
    grid-template-columns: 1fr;
  }
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
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
  cursor: pointer;
}

.feature-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
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
  font-family: var(--sans);
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

- [ ] **Step 4.6: Run tests to verify they pass**

```
ng test --watch=false
```

Expected: todos os testes passam incluindo os três de HomeComponent.

- [ ] **Step 4.7: Commit**

```bash
git add src/app/features/home/
git commit -m "feat: add HomeComponent with feature cards"
```

---

## Task 5: Refatorar DashboardComponent para usar TopbarComponent

**Files:**
- Modify: `src/app/features/dashboard/dashboard.component.ts`
- Modify: `src/app/features/dashboard/dashboard.component.html`
- Modify: `src/app/features/dashboard/dashboard.component.spec.ts`

- [ ] **Step 5.1: Atualizar dashboard.component.html**

Substituir todo o bloco `<div class="topbar">...</div>` por `<app-topbar />`:

```html
<!-- src/app/features/dashboard/dashboard.component.html -->
<div id="app-screen">
  <app-topbar />
  <div class="app">
    @if (isLoading()) {
      <div id="app-loading" class="loading">
        <span class="dot-anim">Carregando seus dados</span>
      </div>
    } @else {
      <div id="app-content">
        <app-config-bar />
        <app-juros-box />
        <app-kpis />
        <app-progress-bar />
        <app-charts />
        <app-parcelas-table />
      </div>
    }
  </div>
</div>
```

- [ ] **Step 5.2: Atualizar dashboard.component.ts**

Adicionar `TopbarComponent` nos imports, remover `RouterLink` (não é mais usado diretamente), remover `logout()` do componente, manter `AuthService` para `ngOnInit`:

```typescript
// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { FinancingService } from '../../core/financing.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ChartsComponent } from './components/charts/charts.component';
import { ConfigBarComponent } from './components/config-bar/config-bar.component';
import { JurosBoxComponent } from './components/juros-box/juros-box.component';
import { KpisComponent } from './components/kpis/kpis.component';
import { ParcelasTableComponent } from './components/parcelas-table/parcelas-table.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TopbarComponent,
    ConfigBarComponent,
    JurosBoxComponent,
    KpisComponent,
    ProgressBarComponent,
    ChartsComponent,
    ParcelasTableComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly financing = inject(FinancingService);

  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForAuth();
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      try {
        await this.financing.loadUserData(userId);
      } catch (e) {
        console.error('loadUserData:', e);
      }
    }
    this.isLoading.set(false);
  }
}
```

- [ ] **Step 5.3: Atualizar dashboard.component.spec.ts**

O teste de email (`#user-email`) ainda funciona porque `TopbarComponent` é compilado junto com `DashboardComponent` no TestBed e usa o mesmo `mockAuth`. Remover apenas o método `logout()` que não existe mais no componente:

```typescript
// src/app/features/dashboard/dashboard.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/auth.service';
import { FinancingService } from '../../core/financing.service';
import { signal, computed } from '@angular/core';
import { provideRouter } from '@angular/router';

const mockInstallments = signal([]);

const mockFinancing = {
  installments:     mockInstallments,
  paidInstallments: computed(() => []),
  openInstallments: computed(() => []),
  totalPaid:        computed(() => 0),
  totalRemaining:   computed(() => 0),
  totalPaidValue:   computed(() => 0),
  totalDiscount:    computed(() => 0),
  faceTotal:        computed(() => 0),
  totalInterest:    computed(() => 0),
  percentPaid:      computed(() => 0),
  config:           signal({ totalInstallments: 36, installmentValue: 0, financedAmount: 0 }),
  saveStatus:       signal('idle' as const),
  setSaveStatus:    () => {},
  loadUserData:     async () => {},
  saveConfig:       async () => {},
  saveAllInstallments: async () => {},
  saveInstallment:  async () => {},
  deleteInstallmentsFrom: async () => {},
  initInstallments: () => {},
};

const mockAuth = {
  currentUser: signal({ id: 'user-1', email: 'test@test.com' } as any),
  waitForAuth: async () => {},
  logout: async () => {},
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
        { provide: FinancingService, useValue: mockFinancing },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows loading state initially', () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#app-loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#app-content')).toBeFalsy();
  });

  it('shows content when not loading', async () => {
    await fixture.whenStable();
    component.isLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#app-content')).toBeTruthy();
  });

  it('displays user email in topbar', async () => {
    await fixture.whenStable();
    component.isLoading.set(false);
    fixture.detectChanges();
    const emailEl = fixture.nativeElement.querySelector('#user-email');
    expect(emailEl.textContent.trim()).toBe('test@test.com');
  });
});
```

- [ ] **Step 5.4: Run tests**

```
ng test --watch=false
```

Expected: todos os testes passam.

- [ ] **Step 5.5: Commit**

```bash
git add src/app/features/dashboard/
git commit -m "refactor: replace inline topbar in DashboardComponent with TopbarComponent"
```

---

## Task 6: Refatorar DespesasComponent para usar TopbarComponent

**Files:**
- Modify: `src/app/features/despesas/despesas.component.ts`
- Modify: `src/app/features/despesas/despesas.component.html`

- [ ] **Step 6.1: Atualizar despesas.component.html**

Substituir o bloco `<div class="topbar">...</div>` por `<app-topbar />`:

```html
<!-- src/app/features/despesas/despesas.component.html -->
<div id="despesas-screen">
  <app-topbar />

  <div class="app">
    @if (isLoading()) {
      <div class="loading"><span class="dot-anim">Carregando</span></div>
    } @else {

      <!-- Fixed section: 3 columns -->
      <div class="fixed-section">
        <app-budget-column tipo="receita" />
        <app-budget-column tipo="despesa" />
        <div class="saldo-fixo-card">
          <div class="saldo-fixo-label">Saldo Fixo</div>
          <div class="saldo-fixo-valor" [class.negativo]="budget.saldo() < 0">
            {{ budget.saldo() | fmtCurrency }}
          </div>
          <div class="saldo-fixo-sub">
            <span>Receitas {{ budget.totalReceitas() | fmtCurrency }}</span>
            <span>Despesas {{ budget.totalDespesas() | fmtCurrency }}</span>
          </div>
        </div>
      </div>

      <!-- Variable transactions -->
      <app-transacoes-table />

      <!-- Total balance -->
      <div class="saldo-total-bar" [class.saldo-total-bar--negativo]="budget.saldoTotal() < 0">
        <div class="saldo-total-breakdown">
          <span>Fixo <strong>{{ budget.saldo() | fmtCurrency }}</strong></span>
          <span class="sep">+</span>
          <span>Variável <strong>{{ budget.saldoVariavel() | fmtCurrency }}</strong></span>
        </div>
        <div class="saldo-total-result">
          <span class="saldo-label">Saldo Total</span>
          <span class="saldo-valor">{{ budget.saldoTotal() | fmtCurrency }}</span>
        </div>
      </div>

    }
  </div>
</div>
```

- [ ] **Step 6.2: Atualizar despesas.component.ts**

Adicionar `TopbarComponent`, remover `RouterLink` (não é mais usado diretamente no template):

```typescript
// src/app/features/despesas/despesas.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { BudgetService } from '../../core/budget.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FmtCurrencyPipe } from '../../shared/pipes/fmt-currency.pipe';
import { BudgetColumnComponent } from './components/budget-column/budget-column.component';
import { TransacoesTableComponent } from './components/transacoes-table/transacoes-table.component';

@Component({
  selector: 'app-despesas',
  standalone: true,
  imports: [TopbarComponent, BudgetColumnComponent, TransacoesTableComponent, FmtCurrencyPipe],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.scss',
})
export class DespesasComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly budget = inject(BudgetService);

  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForAuth();
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      try {
        await this.budget.loadAll(userId);
      } catch (e) {
        console.error('loadAll:', e);
      }
    }
    this.isLoading.set(false);
  }
}
```

- [ ] **Step 6.3: Run tests**

```
ng test --watch=false
```

Expected: todos os testes passam.

- [ ] **Step 6.4: Commit**

```bash
git add src/app/features/despesas/despesas.component.ts src/app/features/despesas/despesas.component.html
git commit -m "refactor: replace inline topbar in DespesasComponent with TopbarComponent"
```

---

## Verificação Final

- [ ] **Step 7.1: Build de produção para garantir zero erros de compilação**

```
ng build
```

Expected: Build sem erros. Ignorar warnings de budget (bundle size).

- [ ] **Step 7.2: Rodar todos os testes**

```
ng test --watch=false
```

Expected: todos os testes passam.

- [ ] **Step 7.3: Testar o app manualmente no navegador**

```
ng serve
```

Verificar:
1. Acessar `http://localhost:4200` sem sessão → redireciona para `/auth`
2. Fazer login → redireciona para `/` (home page com dois cards)
3. Clicar em "Financiamento" → vai para `/financiamento`
4. Topbar mostra "Financiamento" com link ativo
5. Clicar em "Despesas & Receitas" no topbar → vai para `/despesas`
6. Botão "Sair" na tela de despesas funciona
7. Logo "◆ Financiamento" no topbar visível em todas as telas
8. Home: link "Home" no topbar ativo quando em `/`

- [ ] **Step 7.4: Commit final se necessário**

```bash
git add -A
git commit -m "chore: final adjustments for home page and shared topbar"
```
