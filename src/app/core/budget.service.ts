import { Injectable, computed, inject, signal } from '@angular/core';
import { BudgetItem, BudgetItemType } from './models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly sb = inject(SupabaseService).client;

  readonly items = signal<BudgetItem[]>([]);

  readonly receitas  = computed(() => this.items().filter(i => i.tipo === 'receita'));
  readonly despesas  = computed(() => this.items().filter(i => i.tipo === 'despesa'));
  readonly totalReceitas = computed(() => this.receitas().reduce((s, i) => s + i.valor, 0));
  readonly totalDespesas = computed(() => this.despesas().reduce((s, i) => s + i.valor, 0));
  readonly saldo         = computed(() => this.totalReceitas() - this.totalDespesas());

  async loadItems(userId: string): Promise<void> {
    const { data } = await this.sb
      .from('orcamento_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    this.items.set((data ?? []).map((r: any) => ({
      id: r.id, tipo: r.tipo, nome: r.nome, valor: r.valor,
    })));
  }

  async addItem(userId: string, tipo: BudgetItemType, nome: string, valor: number): Promise<void> {
    const { data, error } = await this.sb
      .from('orcamento_items')
      .insert({ user_id: userId, tipo, nome, valor })
      .select()
      .single();

    if (error) throw error;
    this.items.update(list => [...list, { id: data.id, tipo, nome, valor }]);
  }

  async removeItem(userId: string, id: string): Promise<void> {
    const { error } = await this.sb
      .from('orcamento_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.items.update(list => list.filter(i => i.id !== id));
  }
}
