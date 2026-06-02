import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BudgetColumnComponent } from './budget-column.component';
import { BudgetService } from '../../../../core/budget.service';
import { AuthService } from '../../../../core/auth.service';
import { signal, computed } from '@angular/core';

describe('BudgetColumnComponent', () => {
  let component: BudgetColumnComponent;
  let fixture: ComponentFixture<BudgetColumnComponent>;

  const mockBudget = {
    items: signal([
      { id: '1', tipo: 'receita' as const, nome: 'Salário', valor: 5000 },
      { id: '2', tipo: 'despesa' as const, nome: 'Aluguel', valor: 1500 },
    ]),
    receitas:      computed(() => [{ id: '1', tipo: 'receita' as const, nome: 'Salário', valor: 5000 }]),
    despesas:      computed(() => [{ id: '2', tipo: 'despesa' as const, nome: 'Aluguel', valor: 1500 }]),
    totalReceitas: computed(() => 5000),
    totalDespesas: computed(() => 1500),
    addItem:    async () => {},
    removeItem: async () => {},
  };

  const mockAuth = { currentUser: signal({ id: 'user-1' } as any) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetColumnComponent],
      providers: [
        { provide: BudgetService, useValue: mockBudget },
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetColumnComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tipo', 'receita');
    fixture.detectChanges();
  });

  it('shows correct title for receita', () => {
    expect(component.title).toBe('Receitas Fixas');
  });

  it('shows correct items for receita', () => {
    expect(component.items.length).toBe(1);
    expect(component.items[0].nome).toBe('Salário');
  });

  it('shows correct total for receita', () => {
    expect(component.total).toBe(5000);
  });

  it('toggles add form', () => {
    expect(component.isAdding()).toBe(false);
    component.isAdding.set(true);
    expect(component.isAdding()).toBe(true);
    component.cancelAdd();
    expect(component.isAdding()).toBe(false);
  });
});
