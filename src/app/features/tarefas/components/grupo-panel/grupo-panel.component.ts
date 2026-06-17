import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth.service';
import { TaskGroup } from '../../../../core/models';
import { TaskInput, TasksService } from '../../../../core/tasks.service';
import { TarefaFormComponent } from '../tarefa-form/tarefa-form.component';
import { TarefaItemComponent } from '../tarefa-item/tarefa-item.component';

@Component({
  selector: 'app-grupo-panel',
  standalone: true,
  imports: [FormsModule, TarefaItemComponent, TarefaFormComponent],
  templateUrl: './grupo-panel.component.html',
  styleUrl: './grupo-panel.component.scss',
})
export class GrupoPanelComponent {
  readonly grupo = input.required<TaskGroup>();
  /** Quando true, o cabeçalho colapsa/expande o conteúdo do grupo (layout acordeão). */
  readonly collapsible = input(false);

  private readonly tasks = inject(TasksService);
  private readonly auth = inject(AuthService);

  protected readonly isAddingTarefa = signal(false);
  protected readonly isRenaming = signal(false);
  protected readonly isCollapsed = signal(false);
  protected nomeEdit = '';

  protected readonly tarefas = computed(() =>
    this.tasks.tarefas().filter(t => t.grupoId === this.grupo().id),
  );

  protected readonly pendentes = computed(() => this.tarefas().filter(t => !t.concluida).length);

  private get userId(): string {
    return this.auth.currentUser()!.id;
  }

  protected async addTarefa(input: TaskInput): Promise<void> {
    await this.tasks.addTarefa(this.userId, this.grupo().id, input);
    this.isAddingTarefa.set(false);
  }

  protected startRename(): void {
    this.nomeEdit = this.grupo().nome;
    this.isRenaming.set(true);
  }

  protected async saveRename(): Promise<void> {
    const nome = this.nomeEdit.trim();
    if (nome && nome !== this.grupo().nome) {
      await this.tasks.renameGrupo(this.userId, this.grupo().id, nome);
    }
    this.isRenaming.set(false);
  }

  protected async removeGrupo(): Promise<void> {
    const ok = confirm(`Excluir o grupo "${this.grupo().nome}" e todas as suas tarefas?`);
    if (!ok) return;
    await this.tasks.removeGrupo(this.userId, this.grupo().id);
  }
}
