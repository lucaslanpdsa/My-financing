import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth.service';
import { BudgetService } from '../../../../core/budget.service';
import { BudgetItemType } from '../../../../core/models';
import { FmtCurrencyPipe } from '../../../../shared/pipes/fmt-currency.pipe';

@Component({
  selector: 'app-budget-column',
  standalone: true,
  imports: [FormsModule, FmtCurrencyPipe],
  templateUrl: './budget-column.component.html',
  styleUrl: './budget-column.component.scss',
})
export class BudgetColumnComponent {
  readonly tipo = input.required<BudgetItemType>();

  readonly budget = inject(BudgetService);
  private readonly auth = inject(AuthService);

  newNome = '';
  newValor: number | null = null;
  isAdding = signal(false);
  isSaving = signal(false);

  get items() {
    return this.tipo() === 'receita' ? this.budget.receitas() : this.budget.despesas();
  }

  get total() {
    return this.tipo() === 'receita' ? this.budget.totalReceitas() : this.budget.totalDespesas();
  }

  get title() {
    return this.tipo() === 'receita' ? 'Receitas Fixas' : 'Despesas Fixas';
  }

  get accentColor() {
    return this.tipo() === 'receita' ? 'var(--accent)' : 'var(--red)';
  }

  async add(): Promise<void> {
    const nome = this.newNome.trim();
    const valor = this.newValor;
    if (!nome || !valor || valor <= 0) return;

    this.isSaving.set(true);
    try {
      await this.budget.addItem(this.auth.currentUser()!.id, this.tipo(), nome, valor);
      this.newNome = '';
      this.newValor = null;
      this.isAdding.set(false);
    } finally {
      this.isSaving.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    await this.budget.removeItem(this.auth.currentUser()!.id, id);
  }

  cancelAdd(): void {
    this.newNome = '';
    this.newValor = null;
    this.isAdding.set(false);
  }
}
