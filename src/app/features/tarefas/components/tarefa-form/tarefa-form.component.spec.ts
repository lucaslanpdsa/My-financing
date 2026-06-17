import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarefaFormComponent } from './tarefa-form.component';
import { TaskInput } from '../../../../core/tasks.service';

describe('TarefaFormComponent', () => {
  let component: TarefaFormComponent;
  let fixture: ComponentFixture<TarefaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarefaFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TarefaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not emit save when title is empty', () => {
    let emitted = false;
    component.save.subscribe(() => (emitted = true));
    (component as any).titulo = '   ';
    (component as any).submit();
    expect(emitted).toBe(false);
  });

  it('emits save with trimmed values', () => {
    let payload: TaskInput | undefined;
    component.save.subscribe(v => (payload = v));
    (component as any).titulo = '  Estudar  ';
    (component as any).descricao = '  cap 3  ';
    (component as any).prazo = '2026-08-01';
    (component as any).prioridade = 'alta';
    (component as any).submit();
    expect(payload).toEqual({
      titulo: 'Estudar', descricao: 'cap 3', prazo: '2026-08-01', prioridade: 'alta',
    });
  });

  it('emits null for empty description and prazo', () => {
    let payload: TaskInput | undefined;
    component.save.subscribe(v => (payload = v));
    (component as any).titulo = 'Só título';
    (component as any).submit();
    expect(payload?.descricao).toBeNull();
    expect(payload?.prazo).toBeNull();
  });

  it('emits cancel', () => {
    let cancelled = false;
    component.cancel.subscribe(() => (cancelled = true));
    component.cancel.emit();
    expect(cancelled).toBe(true);
  });
});
