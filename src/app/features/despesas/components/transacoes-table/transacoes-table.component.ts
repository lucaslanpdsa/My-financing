import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth.service';
import { BudgetService } from '../../../../core/budget.service';
import { BudgetItemType } from '../../../../core/models';
import { FmtCurrencyPipe } from '../../../../shared/pipes/fmt-currency.pipe';

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
        this.newTipo,
        nome,
        valor,
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
