import { Injectable, computed, inject, signal } from '@angular/core';
import { Task, TaskGroup, TaskPriority } from './models';
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

  readonly grupos = signal<TaskGroup[]>([]);
  readonly tarefas = signal<Task[]>([]);

  tarefasDoGrupo(grupoId: string) {
    return computed(() => this.tarefas().filter(t => t.grupoId === grupoId));
  }

  async loadAll(userId: string): Promise<void> {
    const [gruposResult, tarefasResult] = await Promise.all([
      this.sb.from('tarefa_grupos').select('*').eq('user_id', userId).order('created_at'),
      this.sb.from('tarefas').select('*').eq('user_id', userId).order('created_at'),
    ]);

    this.grupos.set((gruposResult.data ?? []).map(this.mapGrupo));
    this.tarefas.set((tarefasResult.data ?? []).map(this.mapTarefa));
  }

  // ---- Grupos ----

  async addGrupo(userId: string, nome: string): Promise<void> {
    const { data, error } = await this.sb
      .from('tarefa_grupos')
      .insert({ user_id: userId, nome })
      .select().single();
    if (error) throw error;
    this.grupos.update(list => [...list, this.mapGrupo(data)]);
  }

  async renameGrupo(userId: string, id: string, nome: string): Promise<void> {
    const { error } = await this.sb
      .from('tarefa_grupos')
      .update({ nome })
      .eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.grupos.update(list => list.map(g => g.id === id ? { ...g, nome } : g));
  }

  async removeGrupo(userId: string, id: string): Promise<void> {
    const { error } = await this.sb
      .from('tarefa_grupos')
      .delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    this.grupos.update(list => list.filter(g => g.id !== id));
    this.tarefas.update(list => list.filter(t => t.grupoId !== id));
  }

  // ---- Tarefas ----

  async addTarefa(userId: string, grupoId: string, input: TaskInput): Promise<void> {
    const { data, error } = await this.sb
      .from('tarefas')
      .insert({
        user_id: userId,
        grupo_id: grupoId,
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

  private mapGrupo = (r: any): TaskGroup => ({
    id: r.id, nome: r.nome, createdAt: r.created_at,
  });

  private mapTarefa = (r: any): Task => ({
    id: r.id,
    grupoId: r.grupo_id,
    titulo: r.titulo,
    descricao: r.descricao,
    concluida: r.concluida,
    prazo: r.prazo,
    prioridade: r.prioridade,
    createdAt: r.created_at,
  });
}
