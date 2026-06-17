// src/app/shared/components/topbar/topbar.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="topbar">
      <span class="topbar-logo">◆ Financiamento</span>
      <nav class="topbar-nav">
        <a routerLink="/" routerLinkActive="nav-link--active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">Home</a>
        <a routerLink="/financiamento" routerLinkActive="nav-link--active" class="nav-link">Financiamento</a>
        <a routerLink="/despesas" routerLinkActive="nav-link--active" class="nav-link">Despesas & Receitas</a>
        <a routerLink="/tarefas" routerLinkActive="nav-link--active" class="nav-link">Tarefas</a>
      </nav>
      <div class="topbar-right">
        <button
          type="button"
          class="btn-theme"
          (click)="theme.toggle()"
          [attr.aria-label]="theme.theme() === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
          [title]="theme.theme() === 'dark' ? 'Tema claro' : 'Tema escuro'"
        >{{ theme.theme() === 'dark' ? '☀' : '☾' }}</button>
        <span class="user-email" id="user-email">{{ auth.currentUser()?.email }}</span>
        <button type="button" class="btn-logout" (click)="logout()">Sair</button>
      </div>
    </div>
  `,
})
export class TopbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
