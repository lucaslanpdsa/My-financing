// src/app/shared/components/topbar/topbar.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

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
        <span class="user-email" id="user-email">{{ auth.currentUser()?.email }}</span>
        <button type="button" class="btn-logout" (click)="logout()">Sair</button>
      </div>
    </div>
  `,
})
export class TopbarComponent {
  protected readonly auth = inject(AuthService);

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
