import { Injectable, computed, inject, signal } from '@angular/core';
import { BudgetItem, BudgetItemType, Transaction } from './models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly sb = inject(SupabaseService).client;

  // Fixed items
  readonly items = signal<BudgetItem[]>([]);
  readonly receitas      = computed(() => this.items().filter(i => i.tipo === 'receita'));
  readonly despesas      = computed(() => this.items().filter(i => i.tipo === 'despesa'));
  readonly totalReceitas = computed(() => this.receitas().reduce((s, i) => s + i.valor, 0));
  readonly totalDespesas = computed(() => this.despesas().reduce((s, i) => s + i.valor, 0));
  readonly saldo         = computed(() => this.totalReceitas() - this.totalDespesas());

  // Variable transactions
  readonly transactions      = signal<Transaction[]>([]);
  readonly varReceitas       = computed(() => this.transactions().filter(t => t.tipo === 'receita'));
  readonly varDespesas       = computed(() => this.transactions().filter(t => t.tipo === 'despesa'));
  readonly totalVarReceitas  = computed(() => this.varReceitas().reduce((s, t) => s + t.valor, 0));
  readonly totalVarDespesas  = computed(() => this.varDespesas().reduce((s, t) => s + t.valor, 0));
  readonly saldoVariavel     = computed(() => this.totalVarReceitas() - this.totalVarDespesas());
  readonly saldoTotal        = computed(() => this.saldo() + this.saldoVariavel());

  async loadAll(userId: string): Promise<void> {
    const [itemsResult, transResult] = await Promise.all([
      this.sb.from('orcamento_items').select('*').eq('user_id', userId).order('created_at'),
      this.sb.from('transacoes').select('*').eq('user_id', userId).order('data', { ascending: false }).order('created_at', { ascending: false }),
    ]);

    this.items.set((itemsResult.data ?? []).map((r: any) => ({
      id: r.id, tipo: r.tipo, nome: r.nome, valor: r.valor,
    })));

    this.transactions.set((transResult.data ?? []).map((r: any) => ({
      id: r.id, tipo: r.tipo, nome: r.nome, valor: r.valor, data: r.data,
    })));
  }

  async addItem(userId: string, tipo: BudgetItemType, nome: string, valor: number): Promise<void> {
    const { data, error } = await this.sb
      .from('orcamento_items')
      .insert({ user_id: userId, tipo, nome, valor })
      .select().single();
    if (error) throw error;
    this.items.update(list => [...list, { id: data.id, tipo, nome, valor }]);
  }

  async removeItem(userId: string, id: string): Promise<void> {
    const { error } = await this.sb.from('orcamento_items').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.items.update(list => list.filter(i => i.id !== id));
  }

  async addTransaction(userId: string, tipo: BudgetItemType, nome: string, valor: number, data: string | null): Promise<void> {
    const { data: row, error } = await this.sb
      .from('transacoes')
      .insert({ user_id: userId, tipo, nome, valor, data: data || null })
      .select().single();
    if (error) throw error;
    this.transactions.update(list => [{ id: row.id, tipo, nome, valor, data: row.data }, ...list]);
  }

  async removeTransaction(userId: string, id: string): Promise<void> {
    const { error } = await this.sb.from('transacoes').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.transactions.update(list => list.filter(t => t.id !== id));
  }
}
