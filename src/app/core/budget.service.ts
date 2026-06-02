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
  readonly transactions  = signal<Transaction[]>([]);
  readonly selectedMonth = signal<string>(this.monthKey(new Date()));

  readonly filteredTransactions = computed(() => {
    const month = this.selectedMonth();
    return this.transactions().filter(t => this.transactionMonthKey(t) === month);
  });

  readonly varReceitas      = computed(() => this.filteredTransactions().filter(t => t.tipo === 'receita'));
  readonly varDespesas      = computed(() => this.filteredTransactions().filter(t => t.tipo === 'despesa'));
  readonly totalVarReceitas = computed(() => this.varReceitas().reduce((s, t) => s + t.valor, 0));
  readonly totalVarDespesas = computed(() => this.varDespesas().reduce((s, t) => s + t.valor, 0));
  readonly saldoVariavel    = computed(() => this.totalVarReceitas() - this.totalVarDespesas());
  readonly saldoTotal       = computed(() => this.saldo() + this.saldoVariavel());

  monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private transactionMonthKey(t: Transaction): string {
    return t.data ? t.data.substring(0, 7) : t.createdAt.substring(0, 7);
  }

  async loadAll(userId: string): Promise<void> {
    const [itemsResult, transResult] = await Promise.all([
      this.sb.from('orcamento_items').select('*').eq('user_id', userId).order('created_at'),
      this.sb.from('transacoes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    this.items.set((itemsResult.data ?? []).map((r: any) => ({
      id: r.id, tipo: r.tipo, nome: r.nome, valor: r.valor,
    })));

    this.transactions.set((transResult.data ?? []).map((r: any) => ({
      id: r.id, tipo: r.tipo, nome: r.nome, valor: r.valor,
      data: r.data, createdAt: r.created_at,
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
    this.transactions.update(list => [{
      id: row.id, tipo, nome, valor, data: row.data, createdAt: row.created_at,
    }, ...list]);
  }

  async removeTransaction(userId: string, id: string): Promise<void> {
    const { error } = await this.sb.from('transacoes').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.transactions.update(list => list.filter(t => t.id !== id));
  }
}
