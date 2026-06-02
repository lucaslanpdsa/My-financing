import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth.service';
import { FinancingService } from '../../../../core/financing.service';
import { Installment } from '../../../../core/models';
import { FmtCurrencyPipe } from '../../../../shared/pipes/fmt-currency.pipe';

@Component({
  selector: 'app-parcelas-table',
  standalone: true,
  imports: [FmtCurrencyPipe],
  templateUrl: './parcelas-table.component.html',
  styleUrl: './parcelas-table.component.scss',
})
export class ParcelasTableComponent {
  readonly financing = inject(FinancingService);
  private readonly auth = inject(AuthService);

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  readonly totalValue = computed(() =>
    this.financing.installments().reduce((s, i) => s + i.value, 0)
  );

  dateToInputValue(paidDate: string | null): string {
    if (!paidDate) return '';
    return paidDate.split('/').reverse().join('-');
  }

  async togglePaid(idx: number): Promise<void> {
    const list = [...this.financing.installments()];
    const inst = { ...list[idx] };
    inst.paid = !inst.paid;
    if (inst.paid) {
      inst.paidValue = inst.value;
      const now = new Date();
      inst.paidDate = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
    } else {
      inst.paidDate = null;
    }
    list[idx] = inst;
    this.financing.installments.set(list);

    this.financing.setSaveStatus('saving');
    try {
      await this.financing.saveInstallment(this.auth.currentUser()!.id, inst);
      this.financing.setSaveStatus('saved', 2000);
    } catch (e) {
      console.error('togglePaid:', e);
      this.financing.setSaveStatus('error', 2000);
    }
  }

  updateValue(idx: number, rawValue: string): void {
    const v = parseFloat(rawValue);
    if (isNaN(v) || v < 0) return;

    const list = [...this.financing.installments()];
    list[idx] = { ...list[idx], paidValue: v };
    this.financing.installments.set(list);

    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.financing.setSaveStatus('saving');
    this.saveTimer = setTimeout(async () => {
      try {
        await this.financing.saveInstallment(this.auth.currentUser()!.id, list[idx]);
        this.financing.setSaveStatus('saved', 2000);
      } catch (e) {
        console.error('updateValue:', e);
        this.financing.setSaveStatus('error', 2000);
      }
    }, 800);
  }

  async updateDate(idx: number, rawDate: string): Promise<void> {
    if (!rawDate) return;
    const [y, m, d] = rawDate.split('-');
    const list = [...this.financing.installments()];
    list[idx] = { ...list[idx], paidDate: `${d}/${m}/${y}` };
    this.financing.installments.set(list);

    this.financing.setSaveStatus('saving');
    try {
      await this.financing.saveInstallment(this.auth.currentUser()!.id, list[idx]);
      this.financing.setSaveStatus('saved', 2000);
    } catch (e) {
      console.error('updateDate:', e);
      this.financing.setSaveStatus('error', 2000);
    }
  }

  trackByNum(_: number, inst: Installment): number {
    return inst.num;
  }
}
