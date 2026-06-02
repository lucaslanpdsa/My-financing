// src/app/features/home/home.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TopbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly auth = inject(AuthService);
}
