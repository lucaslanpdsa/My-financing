import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth.service';
import { TaskList } from '../../../../core/models';
import { TaskInput, TasksService } from '../../../../core/tasks.service';
import { TarefaFormComponent } from '../tarefa-form/tarefa-form.component';
import { TarefaItemComponent } from '../tarefa-item/tarefa-item.component';

@Component({
  selector: 'app-lista-panel',
  standalone: true,
  imports: [FormsModule, TarefaItemComponent, TarefaFormComponent],
  templateUrl: './lista-panel.component.html',
  styleUrl: './lista-panel.component.scss',
})
export class ListaPanelComponent {
  /** null = painel de tarefas avulsas (sem lista). */
  readonly lista = input<TaskList | null>(null);
  /** Quando true, o cabeçalho colapsa/expande o conteúdo (layout acordeão). */
  readonly collapsible = input(false);

  private readonly tasks = inject(TasksService);
  private readonly auth = inject(AuthService);

  protected readonly isAddingTarefa = signal(false);
  protected readonly isRenaming = signal(false);
  protected readonly isCollapsed = signal(false);
  protected nomeEdit = '';

  protected readonly isAvulsas = computed(() => this.lista() === null);
  protected readonly nome = computed(() => this.lista()?.nome ?? 'Sem lista');
  protected readonly listaId = computed(() => this.lista()?.id ?? null);

  protected readonly tarefas = computed(() =>
    this.tasks.tarefas().filter(t => t.listaId === this.listaId()),
  );

  protected readonly pendentes = computed(() => this.tarefas().filter(t => !t.concluida).length);

  private get userId(): string {
    return this.auth.currentUser()!.id;
  }

  protected async addTarefa(input: TaskInput): Promise<void> {
    await this.tasks.addTarefa(this.userId, this.listaId(), input);
    this.isAddingTarefa.set(false);
  }

  protected startRename(): void {
    const lista = this.lista();
    if (!lista) return;
    this.nomeEdit = lista.nome;
    this.isRenaming.set(true);
  }

  protected async saveRename(): Promise<void> {
    const lista = this.lista();
    const nome = this.nomeEdit.trim();
    if (lista && nome && nome !== lista.nome) {
      await this.tasks.renameLista(this.userId, lista.id, nome);
    }
    this.isRenaming.set(false);
  }

  protected async removeLista(): Promise<void> {
    const lista = this.lista();
    if (!lista) return;
    const ok = confirm(`Excluir a lista "${lista.nome}" e todas as suas tarefas?`);
    if (!ok) return;
    await this.tasks.removeLista(this.userId, lista.id);
  }
}
