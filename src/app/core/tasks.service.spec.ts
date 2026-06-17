import { TestBed } from '@angular/core/testing';
import { TasksService } from './tasks.service';
import { SupabaseService } from './supabase.service';
import { Task, TaskGroup } from './models';

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

const grupo = (id: string, nome: string): TaskGroup => ({ id, nome, createdAt: '2026-01-01T00:00:00Z' });
const tarefa = (id: string, grupoId: string, over: Partial<Task> = {}): Task => ({
  id, grupoId, titulo: 'T', descricao: null, concluida: false,
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

  it('addGrupo appends the created group to the signal', async () => {
    await service.addGrupo('u1', 'Tarefas diárias');
    expect(service.grupos().length).toBe(1);
    expect(service.grupos()[0].nome).toBe('Tarefas diárias');
    expect(service.grupos()[0].id).toBeTruthy();
  });

  it('renameGrupo updates the group name', async () => {
    service.grupos.set([grupo('g1', 'Antigo')]);
    await service.renameGrupo('u1', 'g1', 'Novo');
    expect(service.grupos()[0].nome).toBe('Novo');
  });

  it('removeGrupo removes the group and cascades its tasks', async () => {
    service.grupos.set([grupo('g1', 'A'), grupo('g2', 'B')]);
    service.tarefas.set([tarefa('t1', 'g1'), tarefa('t2', 'g2'), tarefa('t3', 'g1')]);
    await service.removeGrupo('u1', 'g1');
    expect(service.grupos().map(g => g.id)).toEqual(['g2']);
    expect(service.tarefas().map(t => t.id)).toEqual(['t2']);
  });

  it('addTarefa appends the created task to the signal', async () => {
    await service.addTarefa('u1', 'g1', {
      titulo: 'Comprar pão', descricao: 'na padaria', prazo: '2026-07-01', prioridade: 'alta',
    });
    expect(service.tarefas().length).toBe(1);
    const t = service.tarefas()[0];
    expect(t.titulo).toBe('Comprar pão');
    expect(t.grupoId).toBe('g1');
    expect(t.prioridade).toBe('alta');
  });

  it('updateTarefa updates the task fields', async () => {
    service.tarefas.set([tarefa('t1', 'g1', { titulo: 'Old' })]);
    await service.updateTarefa('u1', 't1', {
      titulo: 'New', descricao: 'desc', prazo: null, prioridade: 'baixa',
    });
    const t = service.tarefas()[0];
    expect(t.titulo).toBe('New');
    expect(t.descricao).toBe('desc');
    expect(t.prioridade).toBe('baixa');
  });

  it('toggleConcluida flips the concluida flag', async () => {
    service.tarefas.set([tarefa('t1', 'g1', { concluida: false })]);
    await service.toggleConcluida('u1', 't1');
    expect(service.tarefas()[0].concluida).toBe(true);
    await service.toggleConcluida('u1', 't1');
    expect(service.tarefas()[0].concluida).toBe(false);
  });

  it('removeTarefa removes the task from the signal', async () => {
    service.tarefas.set([tarefa('t1', 'g1'), tarefa('t2', 'g1')]);
    await service.removeTarefa('u1', 't1');
    expect(service.tarefas().map(t => t.id)).toEqual(['t2']);
  });

  it('tarefasDoGrupo filters tasks by group', () => {
    service.tarefas.set([tarefa('t1', 'g1'), tarefa('t2', 'g2'), tarefa('t3', 'g1')]);
    expect(service.tarefasDoGrupo('g1')().map(t => t.id)).toEqual(['t1', 't3']);
  });
});
