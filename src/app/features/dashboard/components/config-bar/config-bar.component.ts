import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth.service';
import { FinancingService } from '../../../../core/financing.service';
import { Installment } from '../../../../core/models';

@Component({
  selector: 'app-config-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './config-bar.component.html',
  styleUrl: './config-bar.component.scss',
})
export class ConfigBarComponent implements OnInit {
  readonly financing = inject(FinancingService);
  private readonly auth = inject(AuthService);

  cfgTotal = signal(0);
  cfgValue = signal(0);
  cfgFinanced = signal(0);

  ngOnInit(): void {
    const cfg = this.financing.config();
    this.cfgTotal.set(cfg.totalInstallments);
    this.cfgValue.set(cfg.installmentValue);
    this.cfgFinanced.set(cfg.financedAmount);
  }

  autoFillFinanced(): void {
    const total = this.cfgTotal();
    const value = this.cfgValue();
    if (total > 0 && value > 0) {
      this.cfgFinanced.set(parseFloat((total * value).toFixed(2)));
    }
  }

  get saveLabel(): string {
    switch (this.financing.saveStatus()) {
      case 'saving': return 'Salvando...';
      case 'saved':  return '✓ Salvo';
      case 'error':  return 'Erro ao salvar';
      default:       return '';
    }
  }

  get saveLabelColor(): string {
    return this.financing.saveStatus() === 'error' ? 'var(--red)' : 'var(--muted)';
  }

  async applyConfig(): Promise<void> {
    const newTotal = this.cfgTotal();
    const newValue = this.cfgValue();
    const newFinanced = this.cfgFinanced();
    const oldTotal = this.financing.config().totalInstallments;

    this.financing.config.set({
      totalInstallments: newTotal,
      installmentValue: newValue,
      financedAmount: newFinanced,
    });

    const prevPaid: Record<number, { val: number; dt: string | null }> = {};
    this.financing.installments().forEach(i => {
      if (i.paid) prevPaid[i.num] = { val: i.paidValue, dt: i.paidDate };
    });

    const newInstallments: Installment[] = Array.from({ length: newTotal }, (_, idx) => {
      const num = idx + 1;
      const prev = prevPaid[num];
      return { num, total: newTotal, value: newValue, paid: !!prev, paidValue: prev ? prev.val : newValue, paidDate: prev ? prev.dt : null };
    });
    this.financing.installments.set(newInstallments);

    this.financing.setSaveStatus('saving');
    try {
      const userId = this.auth.currentUser()!.id;
      if (newTotal < oldTotal) await this.financing.deleteInstallmentsFrom(userId, newTotal + 1);
      await Promise.all([this.financing.saveConfig(userId), this.financing.saveAllInstallments(userId)]);
      this.financing.setSaveStatus('saved', 2000);
    } catch (e) {
      console.error('applyConfig:', e);
      this.financing.setSaveStatus('error', 2000);
    }
  }
}
