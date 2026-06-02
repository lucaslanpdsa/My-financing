import { Component, computed, inject } from '@angular/core';
import { FmtCurrencyPipe } from '../../../../shared/pipes/fmt-currency.pipe';
import { FinancingService } from '../../../../core/financing.service';

@Component({
  selector: 'app-juros-box',
  standalone: true,
  imports: [FmtCurrencyPipe],
  templateUrl: './juros-box.component.html',
  styleUrl: './juros-box.component.scss',
})
export class JurosBoxComponent {
  readonly financing = inject(FinancingService);

  readonly effectiveCost = computed(() => {
    const fin = this.financing.config().financedAmount;
    const face = this.financing.faceTotal();
    return fin > 0 ? ((face / fin) - 1) * 100 : 0;
  });

  readonly monthlyRate = computed(() => {
    const fin = this.financing.config().financedAmount;
    const face = this.financing.faceTotal();
    const n = this.financing.installments().length;
    return fin > 0 && n > 0 ? (Math.pow(face / fin, 1 / n) - 1) * 100 : 0;
  });

  readonly annualRate = computed(() =>
    (Math.pow(1 + this.monthlyRate() / 100, 12) - 1) * 100
  );
}
