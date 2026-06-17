import { Injectable, computed, inject, signal } from '@angular/core';
import { Task, TaskList, TaskPriority } from './models';
import { SupabaseService } from './supabase.service';

export interface TaskInput {
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  prioridade: TaskPriority;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly sb = inject(SupabaseService).client;

  readonly listas = signal<TaskList[]>([]);
  readonly tarefas = signal<Task[]>([]);

  /** Tarefas sem lista (avulsas, estilo ClickUp). */
  readonly tarefasAvulsas = computed(() => this.tarefas().filter(t => t.listaId === null));

  tarefasDaLista(listaId: string | null) {
    return computed(() => this.tarefas().filter(t => t.listaId === listaId));
  }

  async loadAll(userId: string): Promise<void> {
    const [listasResult, tarefasResult] = await Promise.all([
      this.sb.from('tarefa_listas').select('*').eq('user_id', userId).order('created_at'),
      this.sb.from('tarefas').select('*').eq('user_id', userId).order('created_at'),
    ]);

    this.listas.set((listasResult.data ?? []).map(this.mapLista));
    this.tarefas.set((tarefasResult.data ?? []).map(this.mapTarefa));
  }

  // ---- Listas ----

  async addLista(userId: string, nome: string): Promise<void> {
    const { data, error } = await this.sb
      .from('tarefa_listas')
      .insert({ user_id: userId, nome })
      .select().single();
    if (error) throw error;
    this.listas.update(list => [...list, this.mapLista(data)]);
  }

  async renameLista(userId: string, id: string, nome: string): Promise<void> {
    const { error } = await this.sb
      .from('tarefa_listas')
      .update({ nome })
      .eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.listas.update(list => list.map(l => l.id === id ? { ...l, nome } : l));
  }

  async removeLista(userId: string, id: string): Promise<void> {
    const { error } = await this.sb
      .from('tarefa_listas')
      .delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.listas.update(list => list.filter(l => l.id !== id));
    this.tarefas.update(list => list.filter(t => t.listaId !== id));
  }

  // ---- Tarefas ----

  async addTarefa(userId: string, listaId: string | null, input: TaskInput): Promise<void> {
    const { data, error } = await this.sb
      .from('tarefas')
      .insert({
        user_id: userId,
        lista_id: listaId,
        titulo: input.titulo,
        descricao: input.descricao,
        prazo: input.prazo,
        prioridade: input.prioridade,
      })
      .select().single();
    if (error) throw error;
    this.tarefas.update(list => [...list, this.mapTarefa(data)]);
  }

  async updateTarefa(userId: string, id: string, input: TaskInput): Promise<void> {
    const { error } = await this.sb
      .from('tarefas')
      .update({
        titulo: input.titulo,
        descricao: input.descricao,
        prazo: input.prazo,
        prioridade: input.prioridade,
      })
      .eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.tarefas.update(list => list.map(t => t.id === id ? { ...t, ...input } : t));
  }

  async toggleConcluida(userId: string, id: string): Promise<void> {
    const current = this.tarefas().find(t => t.id === id);
    if (!current) return;
    const concluida = !current.concluida;
    const { error } = await this.sb
      .from('tarefas')
      .update({ concluida })
      .eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.tarefas.update(list => list.map(t => t.id === id ? { ...t, concluida } : t));
  }

  async removeTarefa(userId: string, id: string): Promise<void> {
    const { error } = await this.sb
      .from('tarefas')
      .delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.tarefas.update(list => list.filter(t => t.id !== id));
  }

  // ---- Mappers ----

  private mapLista = (r: any): TaskList => ({
    id: r.id, nome: r.nome, createdAt: r.created_at,
  });

  private mapTarefa = (r: any): Task => ({
    id: r.id,
    listaId: r.lista_id,
    titulo: r.titulo,
    descricao: r.descricao,
    concluida: r.concluida,
    prazo: r.prazo,
    prioridade: r.prioridade,
    createdAt: r.created_at,
  });
}
