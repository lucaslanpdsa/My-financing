import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { TasksService } from '../../core/tasks.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { GrupoPanelComponent } from './components/grupo-panel/grupo-panel.component';

type Layout = 'colunas' | 'lista' | 'acordeao';
const LAYOUT_KEY = 'tarefas-layout';

@Component({
  selector: 'app-tarefas',
  standalone: true,
  imports: [FormsModule, TopbarComponent, GrupoPanelComponent],
  templateUrl: './tarefas.component.html',
  styleUrl: './tarefas.component.scss',
})
export class TarefasComponent implements OnInit {
  readonly tasks = inject(TasksService);
  private readonly auth = inject(AuthService);

  readonly isLoading = signal(true);
  readonly layout = signal<Layout>(this.readLayout());

  readonly isAddingGrupo = signal(false);
  newGrupoNome = '';

  private readonly selectedGrupoId = signal<string | null>(null);

  readonly grupos = this.tasks.grupos;

  /** Grupo ativo no layout "lista": o selecionado, ou o primeiro como fallback. */
  readonly grupoAtivo = computed(() => {
    const grupos = this.grupos();
    return grupos.find(g => g.id === this.selectedGrupoId()) ?? grupos[0] ?? null;
  });

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

  selectGrupo(id: string): void {
    this.selectedGrupoId.set(id);
  }

  async addGrupo(): Promise<void> {
    const nome = this.newGrupoNome.trim();
    if (!nome) return;
    await this.tasks.addGrupo(this.userId, nome);
    this.newGrupoNome = '';
    this.isAddingGrupo.set(false);
  }

  cancelAddGrupo(): void {
    this.newGrupoNome = '';
    this.isAddingGrupo.set(false);
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
