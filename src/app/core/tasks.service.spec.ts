import { TestBed } from '@angular/core/testing';
import { TasksService } from './tasks.service';
import { SupabaseService } from './supabase.service';
import { Task, TaskList } from './models';

let idCounter = 0;

// Mock do client Supabase: cada método encadeia e os pontos terminais
// (order/single/then) resolvem com um resultado de sucesso.
const mockClient = {
  from() {
    let insertPayload: any = null;
    const builder: any = {
      select: () => builder,
      insert: (p: any) => { insertPayload = p; return builder; },
      update: () => builder,
      delete: () => builder,
      eq: () => builder,
      order: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({
        data: { id: `id-${++idCounter}`, created_at: '2026-01-01T00:00:00Z', ...insertPayload },
        error: null,
      }),
      then: (onFulfilled: any) => onFulfilled({ error: null }),
    };
    return builder;
  },
};

const lista = (id: string, nome: string): TaskList => ({ id, nome, createdAt: '2026-01-01T00:00:00Z' });
const tarefa = (id: string, listaId: string | null, over: Partial<Task> = {}): Task => ({
  id, listaId, titulo: 'T', descricao: null, concluida: false,
  prazo: null, prioridade: 'media', createdAt: '2026-01-01T00:00:00Z', ...over,
});

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TasksService,
        { provide: SupabaseService, useValue: { client: mockClient } },
      ],
    });
    service = TestBed.inject(TasksService);
  });

  it('addLista appends the created list to the signal', async () => {
    await service.addLista('u1', 'Tarefas diárias');
    expect(service.listas().length).toBe(1);
    expect(service.listas()[0].nome).toBe('Tarefas diárias');
    expect(service.listas()[0].id).toBeTruthy();
  });

  it('renameLista updates the list name', async () => {
    service.listas.set([lista('l1', 'Antigo')]);
    await service.renameLista('u1', 'l1', 'Novo');
    expect(service.listas()[0].nome).toBe('Novo');
  });

  it('removeLista removes the list and cascades its tasks', async () => {
    service.listas.set([lista('l1', 'A'), lista('l2', 'B')]);
    service.tarefas.set([tarefa('t1', 'l1'), tarefa('t2', 'l2'), tarefa('t3', 'l1')]);
    await service.removeLista('u1', 'l1');
    expect(service.listas().map(l => l.id)).toEqual(['l2']);
    expect(service.tarefas().map(t => t.id)).toEqual(['t2']);
  });

  it('addTarefa appends a task to a list', async () => {
    await service.addTarefa('u1', 'l1', {
      titulo: 'Comprar pão', descricao: 'na padaria', prazo: '2026-07-01', prioridade: 'alta',
    });
    expect(service.tarefas().length).toBe(1);
    const t = service.tarefas()[0];
    expect(t.titulo).toBe('Comprar pão');
    expect(t.listaId).toBe('l1');
    expect(t.prioridade).toBe('alta');
  });

  it('addTarefa with null list creates a standalone (avulsa) task', async () => {
    await service.addTarefa('u1', null, {
      titulo: 'Ligar pro dentista', descricao: null, prazo: null, prioridade: 'media',
    });
    const t = service.tarefas()[0];
    expect(t.listaId).toBeNull();
    expect(service.tarefasAvulsas().length).toBe(1);
  });

  it('tarefasAvulsas only includes tasks without a list', () => {
    service.tarefas.set([tarefa('t1', null), tarefa('t2', 'l1'), tarefa('t3', null)]);
    expect(service.tarefasAvulsas().map(t => t.id)).toEqual(['t1', 't3']);
  });

  it('updateTarefa updates the task fields', async () => {
    service.tarefas.set([tarefa('t1', 'l1', { titulo: 'Old' })]);
    await service.updateTarefa('u1', 't1', {
      titulo: 'New', descricao: 'desc', prazo: null, prioridade: 'baixa',
    });
    const t = service.tarefas()[0];
    expect(t.titulo).toBe('New');
    expect(t.descricao).toBe('desc');
    expect(t.prioridade).toBe('baixa');
  });

  it('toggleConcluida flips the concluida flag', async () => {
    service.tarefas.set([tarefa('t1', 'l1', { concluida: false })]);
    await service.toggleConcluida('u1', 't1');
    expect(service.tarefas()[0].concluida).toBe(true);
    await service.toggleConcluida('u1', 't1');
    expect(service.tarefas()[0].concluida).toBe(false);
  });

  it('removeTarefa removes the task from the signal', async () => {
    service.tarefas.set([tarefa('t1', 'l1'), tarefa('t2', 'l1')]);
    await service.removeTarefa('u1', 't1');
    expect(service.tarefas().map(t => t.id)).toEqual(['t2']);
  });

  it('tarefasDaLista filters tasks by list', () => {
    service.tarefas.set([tarefa('t1', 'l1'), tarefa('t2', 'l2'), tarefa('t3', 'l1')]);
    expect(service.tarefasDaLista('l1')().map(t => t.id)).toEqual(['t1', 't3']);
  });
});
