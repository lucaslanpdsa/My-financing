import { Component, inject, input, signal } from '@angular/core';
import { AuthService } from '../../../../core/auth.service';
import { Task } from '../../../../core/models';
import { TaskInput, TasksService } from '../../../../core/tasks.service';
import { TarefaFormComponent } from '../tarefa-form/tarefa-form.component';

@Component({
  selector: 'app-tarefa-item',
  standalone: true,
  imports: [TarefaFormComponent],
  templateUrl: './tarefa-item.component.html',
  styleUrl: './tarefa-item.component.scss',
})
export class TarefaItemComponent {
  readonly tarefa = input.required<Task>();

  private readonly tasks = inject(TasksService);
  private readonly auth = inject(AuthService);

  protected readonly isEditing = signal(false);

  private get userId(): string {
    return this.auth.currentUser()!.id;
  }

  protected readonly prioridadeLabel: Record<string, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
  };

  protected async toggle(): Promise<void> {
    await this.tasks.toggleConcluida(this.userId, this.tarefa().id);
  }

  protected async remove(): Promise<void> {
    await this.tasks.removeTarefa(this.userId, this.tarefa().id);
  }

  protected async saveEdit(input: TaskInput): Promise<void> {
    await this.tasks.updateTarefa(this.userId, this.tarefa().id, input);
    this.isEditing.set(false);
  }
}
