import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TarefasComponent } from './tarefas.component';
import { AuthService } from '../../core/auth.service';
import { TasksService } from '../../core/tasks.service';
import { Task, TaskList } from '../../core/models';

const mockAuth = {
  currentUser: signal({ id: 'u1', email: 'test@test.com' } as any),
  logout: async () => {},
  waitForAuth: async () => {},
};

const listas = signal<TaskList[]>([]);
const tarefas = signal<Task[]>([]);

const mockTasks = {
  listas,
  tarefas,
  tarefasAvulsas: signal<Task[]>([]),
  tarefasDaLista: () => signal([]),
  loadAll: async () => {},
  addLista: async () => {},
  addTarefa: async () => {},
};

describe('TarefasComponent', () => {
  let component: TarefasComponent;
  let fixture: ComponentFixture<TarefasComponent>;

  beforeEach(async () => {
    listas.set([]);
    tarefas.set([]);
    (mockTasks.tarefasAvulsas as any).set([]);
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [TarefasComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
        { provide: TasksService, useValue: mockTasks },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TarefasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the three layout buttons', async () => {
    await fixture.whenStable();
    component.isLoading.set(false);
    fixture.detectChanges();
    const btns = fixture.nativeElement.querySelectorAll('.ls-btn');
    expect(btns.length).toBe(3);
  });

  it('shows empty state when there are no lists or standalone tasks', async () => {
    await fixture.whenStable();
    component.isLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.vazio')).toBeTruthy();
  });

  it('setLayout persists the choice to localStorage', () => {
    component.setLayout('acordeao');
    expect(component.layout()).toBe('acordeao');
    expect(localStorage.getItem('tarefas-layout')).toBe('acordeao');
  });

  it('renders a list panel when a list exists', async () => {
    listas.set([{ id: 'l1', nome: 'Diárias', createdAt: '2026-01-01T00:00:00Z' }]);
    await fixture.whenStable();
    component.isLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.layout-colunas')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Diárias');
  });

  it('shows a "Sem lista" panel when there are standalone tasks', async () => {
    (mockTasks.tarefasAvulsas as any).set([
      { id: 't1', listaId: null, titulo: 'Avulsa', descricao: null, concluida: false, prazo: null, prioridade: 'media', createdAt: '2026-01-01T00:00:00Z' },
    ]);
    tarefas.set([
      { id: 't1', listaId: null, titulo: 'Avulsa', descricao: null, concluida: false, prazo: null, prioridade: 'media', createdAt: '2026-01-01T00:00:00Z' },
    ]);
    await fixture.whenStable();
    component.isLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sem lista');
  });
});
