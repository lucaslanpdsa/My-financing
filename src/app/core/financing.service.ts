import { Injectable, computed, inject, signal } from '@angular/core';
import { FinancingConfig, Installment, SaveStatus } from './models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class FinancingService {
  private readonly sb = inject(SupabaseService).client;

  readonly installments = signal<Installment[]>([]);
  readonly config = signal<FinancingConfig>({
    totalInstallments: 0,
    installmentValue: 0,
    financedAmount: 0,
  });
  readonly saveStatus = signal<SaveStatus>('idle');

  readonly paidInstallments = computed(() => this.installments().filter(i => i.paid));
  readonly openInstallments = computed(() => this.installments().filter(i => !i.paid));
  readonly totalPaid = computed(() => this.paidInstallments().reduce((s, i) => s + i.paidValue, 0));
  readonly totalRemaining = computed(() => this.openInstallments().reduce((s, i) => s + i.value, 0));
  readonly percentPaid = computed(() => {
    const total = this.installments().length;
    return total ? Math.round(this.paidInstallments().length / total * 100) : 0;
  });
  readonly faceTotal = computed(() => this.installments().length * this.config().installmentValue);
  readonly totalInterest = computed(() => Math.max(0, this.faceTotal() - this.config().financedAmount));
  readonly totalDiscount = computed(() =>
    this.paidInstallments().reduce((s, i) => s + Math.max(0, i.value - i.paidValue), 0)
  );

  initInstallments(total: number, value: number): void {
    this.installments.set(
      Array.from({ length: total }, (_, idx) => ({
        num: idx + 1, total, value, paid: false, paidValue: value, paidDate: null,
      }))
    );
  }

  async loadUserData(userId: string): Promise<void> {
    const [cfgResult, installResult] = await Promise.all([
      this.sb.from('financiamento_config').select('*').eq('user_id', userId).maybeSingle(),
      this.sb.from('parcelas').select('*').eq('user_id', userId).order('numero'),
    ]);

    const cfgData = cfgResult.data;
    const installData = installResult.data;

    if (cfgData) {
      this.config.set({
        totalInstallments: cfgData.total_parcelas,
        installmentValue: cfgData.valor_parcela,
        financedAmount: cfgData.valor_financiado,
      });
    }

    if (installData && installData.length > 0) {
      const cfg = this.config();
      this.installments.set(installData.map((p: any) => ({
        num: p.numero,
        total: cfg.totalInstallments,
        value: cfg.installmentValue,
        paid: p.paga,
        paidValue: p.valor_pago,
        paidDate: p.data_pagamento,
      })));
    } else if (!cfgData) {
      const cfg = this.config();
      this.initInstallments(cfg.totalInstallments, cfg.installmentValue);
    }
  }

  async saveConfig(userId: string): Promise<void> {
    const cfg = this.config();
    const { error } = await this.sb.from('financiamento_config').upsert({
      user_id: userId,
      total_parcelas: cfg.totalInstallments,
      valor_parcela: cfg.installmentValue,
      valor_financiado: cfg.financedAmount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw error;
  }

  async saveInstallment(userId: string, inst: Installment): Promise<void> {
    const { error } = await this.sb.from('parcelas').upsert({
      user_id: userId,
      numero: inst.num,
      paga: inst.paid,
      valor_pago: inst.paidValue,
      data_pagamento: inst.paidDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,numero' });
    if (error) throw error;
  }

  async saveAllInstallments(userId: string): Promise<void> {
    const rows = this.installments().map(inst => ({
      user_id: userId,
      numero: inst.num,
      paga: inst.paid,
      valor_pago: inst.paidValue,
      data_pagamento: inst.paidDate,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await this.sb.from('parcelas').upsert(rows, { onConflict: 'user_id,numero' });
    if (error) throw error;
  }

  async deleteInstallmentsFrom(userId: string, fromNum: number): Promise<void> {
    const { error } = await this.sb.from('parcelas').delete()
      .eq('user_id', userId).gte('numero', fromNum);
    if (error) throw error;
  }

  setSaveStatus(status: SaveStatus, clearAfterMs?: number): void {
    this.saveStatus.set(status);
    if (clearAfterMs) setTimeout(() => this.saveStatus.set('idle'), clearAfterMs);
  }
}
