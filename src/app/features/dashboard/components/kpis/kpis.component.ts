import { Component, inject } from '@angular/core';
import { FmtCurrencyPipe } from '../../../../shared/pipes/fmt-currency.pipe';
import { FinancingService } from '../../../../core/financing.service';

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [FmtCurrencyPipe],
  templateUrl: './kpis.component.html',
  styleUrl: './kpis.component.scss',
})
export class KpisComponent {
  readonly financing = inject(FinancingService);
}
