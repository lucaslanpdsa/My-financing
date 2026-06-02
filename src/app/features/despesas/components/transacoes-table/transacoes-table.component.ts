import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth.service';
import { BudgetService } from '../../../../core/budget.service';
import { BudgetItemType } from '../../../../core/models';
import { FmtCurrencyPipe } from '../../../../shared/pipes/fmt-currency.pipe';

const MONTH_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

@Component({
  selector: 'app-transacoes-table',
  standalone: true,
  imports: [FormsModule, FmtCurrencyPipe],
  templateUrl: './transacoes-table.component.html',
  styleUrl: './transacoes-table.component.scss',
})
export class TransacoesTableComponent {
  readonly budget = inject(BudgetService);
  private readonly auth = inject(AuthService);

  isAdding = signal(false);
  isSaving = signal(false);

  newNome  = '';
  newValor: number | null = null;
  newTipo: BudgetItemType = 'despesa';
  newData  = '';

  readonly currentMonthKey = computed(() => this.budget.monthKey(new Date()));

  readonly isCurrentMonth = computed(() =>
    this.budget.selectedMonth() === this.currentMonthKey()
  );

  readonly monthLabel = computed(() => {
    const [y, m] = this.budget.selectedMonth().split('-').map(Number);
    return `${MONTH_LABELS[m - 1]} ${y}`;
  });

  prevMonth(): void {
    const [y, m] = this.budget.selectedMonth().split('-').map(Number);
    const d = new Date(y, m - 2);
    this.budget.selectedMonth.set(this.budget.monthKey(d));
  }

  nextMonth(): void {
    if (this.isCurrentMonth()) return;
    const [y, m] = this.budget.selectedMonth().split('-').map(Number);
    const d = new Date(y, m);
    this.budget.selectedMonth.set(this.budget.monthKey(d));
  }

  formatDate(data: string | null): string {
    if (!data) return '—';
    const [y, m, d] = data.split('-');
    return `${d}/${m}/${y}`;
  }

  async add(): Promise<void> {
    const nome = this.newNome.trim();
    const valor = this.newValor;
    if (!nome || !valor || valor <= 0) return;

    this.isSaving.set(true);
    try {
      await this.budget.addTransaction(
        this.auth.currentUser()!.id,
        this.newTipo, nome, valor,
        this.newData || null,
      );
      this.newNome  = '';
      this.newValor = null;
      this.newData  = '';
      this.newTipo  = 'despesa';
      this.isAdding.set(false);
    } finally {
      this.isSaving.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    await this.budget.removeTransaction(this.auth.currentUser()!.id, id);
  }

  cancelAdd(): void {
    this.newNome  = '';
    this.newValor = null;
    this.newData  = '';
    this.newTipo  = 'despesa';
    this.isAdding.set(false);
  }
}
