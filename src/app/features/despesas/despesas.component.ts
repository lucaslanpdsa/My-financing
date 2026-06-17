import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { BudgetService } from '../../core/budget.service';
import { FmtCurrencyPipe } from '../../shared/pipes/fmt-currency.pipe';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
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
  readonly auth = inject(AuthService);
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
