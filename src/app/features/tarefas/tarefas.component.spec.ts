import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TarefasComponent } from './tarefas.component';
import { AuthService } from '../../core/auth.service';
import { TasksService } from '../../core/tasks.service';
import { TaskGroup } from '../../core/models';

const mockAuth = {
  currentUser: signal({ id: 'u1', email: 'test@test.com' } as any),
  logout: async () => {},
  waitForAuth: async () => {},
};

const grupos = signal<TaskGroup[]>([]);

const mockTasks = {
  grupos,
  tarefas: signal([]),
  tarefasDoGrupo: () => signal([]),
  loadAll: async () => {},
  addGrupo: async () => {},
};

describe('TarefasComponent', () => {
  let component: TarefasComponent;
  let fixture: ComponentFixture<TarefasComponent>;

  beforeEach(async () => {
    grupos.set([]);
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

  it('shows empty state when there are no groups', async () => {
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

  it('renders a group panel when a group exists', async () => {
    grupos.set([{ id: 'g1', nome: 'Diárias', createdAt: '2026-01-01T00:00:00Z' }]);
    await fixture.whenStable();
    component.isLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.layout-colunas')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Diárias');
  });
});
