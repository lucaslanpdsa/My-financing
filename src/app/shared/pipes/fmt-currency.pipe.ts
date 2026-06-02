import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fmtCurrency', standalone: true, pure: true })
export class FmtCurrencyPipe implements PipeTransform {
  transform(value: number): string {
    return 'R$ ' + value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
