import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { FinancingService } from '../../core/financing.service';
import { ChartsComponent } from './components/charts/charts.component';
import { ConfigBarComponent } from './components/config-bar/config-bar.component';
import { JurosBoxComponent } from './components/juros-box/juros-box.component';
import { KpisComponent } from './components/kpis/kpis.component';
import { ParcelasTableComponent } from './components/parcelas-table/parcelas-table.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ConfigBarComponent,
    JurosBoxComponent,
    KpisComponent,
    ProgressBarComponent,
    ChartsComponent,
    ParcelasTableComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly financing = inject(FinancingService);

  isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.auth.waitForAuth();
    const userId = this.auth.currentUser()?.id;
    if (userId) {
      try {
        await this.financing.loadUserData(userId);
      } catch (e) {
        console.error('loadUserData:', e);
      }
    }
    this.isLoading.set(false);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
