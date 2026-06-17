import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { TaskList } from '../../core/models';
import { TaskInput, TasksService } from '../../core/tasks.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ListaPanelComponent } from './components/lista-panel/lista-panel.component';
import { TarefaFormComponent } from './components/tarefa-form/tarefa-form.component';

type Layout = 'colunas' | 'lista' | 'acordeao';
const LAYOUT_KEY = 'tarefas-layout';
const AVULSAS_ID = '__avulsas__';

interface Painel {
  id: string;
  nome: string;
  lista: TaskList | null;
}

@Component({
  selector: 'app-tarefas',
  standalone: true,
  imports: [FormsModule, TopbarComponent, ListaPanelComponent, TarefaFormComponent],
  templateUrl: './tarefas.component.html',
  styleUrl: './tarefas.component.scss',
})
export class TarefasComponent implements OnInit {
  readonly tasks = inject(TasksService);
  private readonly auth = inject(AuthService);

  readonly isLoading = signal(true);
  readonly layout = signal<Layout>(this.readLayout());

  readonly isAddingLista = signal(false);
  newListaNome = '';

  readonly isAddingTarefaAvulsa = signal(false);

  private readonly selectedId = signal<string | null>(null);

  readonly listas = this.tasks.listas;

  /** Painéis exibidos: avulsas (se houver) primeiro, depois as listas. */
  readonly painels = computed<Painel[]>(() => {
    const list: Painel[] = [];
    if (this.tasks.tarefasAvulsas().length > 0) {
      list.push({ id: AVULSAS_ID, nome: 'Sem lista', lista: null });
    }
    for (const l of this.listas()) {
      list.push({ id: l.id, nome: l.nome, lista: l });
    }
    return list;
  });

  /** Painel ativo no layout "lista": o selecionado, ou o primeiro como fallback. */
  readonly painelAtivo = computed(() => {
    const painels = this.painels();
    return painels.find(p => p.id === this.selectedId()) ?? painels[0] ?? null;
  });

  readonly vazio = computed(() => this.listas().length === 0 && this.tasks.tarefasAvulsas().length === 0);

  private get userId(): string {
    return this.auth.currentUser()!.id;
  }

  async ngOnInit(): Promise<void> {
    await this.auth.waitForAuth();
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      try {
        await this.tasks.loadAll(userId);
      } catch (e) {
        console.error('loadAll tarefas:', e);
      }
    }
    this.isLoading.set(false);
  }

  setLayout(l: Layout): void {
    this.layout.set(l);
    try {
      localStorage.setItem(LAYOUT_KEY, l);
    } catch {
      // localStorage indisponível — ignora, mantém só em memória.
    }
  }

  selectPainel(id: string): void {
    this.selectedId.set(id);
  }

  async addLista(): Promise<void> {
    const nome = this.newListaNome.trim();
    if (!nome) return;
    await this.tasks.addLista(this.userId, nome);
    this.newListaNome = '';
    this.isAddingLista.set(false);
  }

  cancelAddLista(): void {
    this.newListaNome = '';
    this.isAddingLista.set(false);
  }

  async addTarefaAvulsa(input: TaskInput): Promise<void> {
    await this.tasks.addTarefa(this.userId, null, input);
    this.isAddingTarefaAvulsa.set(false);
  }

  private readLayout(): Layout {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved === 'colunas' || saved === 'lista' || saved === 'acordeao') return saved;
    } catch {
      // ignore
    }
    return 'colunas';
  }
}
