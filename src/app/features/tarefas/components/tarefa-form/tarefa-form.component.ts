import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TaskPriority } from '../../../../core/models';
import { TaskInput } from '../../../../core/tasks.service';

@Component({
  selector: 'app-tarefa-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tarefa-form.component.html',
  styleUrl: './tarefa-form.component.scss',
})
export class TarefaFormComponent implements OnInit {
  /** Quando presente, o formulário está em modo edição. */
  readonly tarefa = input<Task | null>(null);

  readonly save = output<TaskInput>();
  readonly cancel = output<void>();

  protected titulo = '';
  protected descricao = '';
  protected prazo = '';
  protected prioridade: TaskPriority = 'media';
  protected readonly isSaving = signal(false);

  protected readonly isEdit = computed(() => this.tarefa() !== null);

  ngOnInit(): void {
    const t = this.tarefa();
    if (t) {
      this.titulo = t.titulo;
      this.descricao = t.descricao ?? '';
      this.prazo = t.prazo ?? '';
      this.prioridade = t.prioridade;
    }
  }

  protected submit(): void {
    const titulo = this.titulo.trim();
    if (!titulo) return;
    this.isSaving.set(true);
    this.save.emit({
      titulo,
      descricao: this.descricao.trim() || null,
      prazo: this.prazo || null,
      prioridade: this.prioridade,
    });
    // O pai fecha o formulário; reset defensivo caso seja reutilizado.
    this.isSaving.set(false);
  }
}
