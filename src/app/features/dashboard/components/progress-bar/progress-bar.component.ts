import { Component, inject } from '@angular/core';
import { FinancingService } from '../../../../core/financing.service';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
})
export class ProgressBarComponent {
  readonly financing = inject(FinancingService);
}
