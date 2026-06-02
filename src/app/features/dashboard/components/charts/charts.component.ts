import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, inject, signal } from '@angular/core';
import { Chart, ChartOptions, registerables } from 'chart.js';
import { FmtCurrencyPipe } from '../../../../shared/pipes/fmt-currency.pipe';
import { FinancingService } from '../../../../core/financing.service';

Chart.register(...registerables);

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function sortDates(a: string, b: string): number {
  if (!a) return 1;
  if (!b) return -1;
  const [da, ma, ya] = a.split('/');
  const [db, mb, yb] = b.split('/');
  return new Date(+ya, +ma - 1, +da).getTime() - new Date(+yb, +mb - 1, +db).getTime();
}

function getMonthKey(date: string): string {
  const [, m, y] = date.split('/');
  return `${y}-${m}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${MONTH_LABELS[parseInt(m) - 1]}/${y}`;
}

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [FmtCurrencyPipe],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.scss',
})
export class ChartsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartByDate') chartByDateRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartByMonth') chartByMonthRef!: ElementRef<HTMLCanvasElement>;

  readonly financing = inject(FinancingService);

  private chartByDate: Chart | null = null;
  private chartByMonth: Chart | null = null;
  private viewReady = false;

  readonly monthAvg = signal(0);
  readonly monthCount = signal(0);

  constructor() {
    effect(() => {
      this.financing.paidInstallments(); // subscribe to changes
      if (this.viewReady) this.renderCharts();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.chartByDate?.destroy();
    this.chartByMonth?.destroy();
  }

  private renderCharts(): void {
    const byDate: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    const byMonthCount: Record<string, number> = {};

    for (const inst of this.financing.paidInstallments()) {
      if (!inst.paidDate) continue;
      byDate[inst.paidDate] = (byDate[inst.paidDate] ?? 0) + inst.paidValue;
      const mk = getMonthKey(inst.paidDate);
      byMonth[mk] = (byMonth[mk] ?? 0) + inst.paidValue;
      byMonthCount[mk] = (byMonthCount[mk] ?? 0) + 1;
    }

    const dateKeys = Object.keys(byDate).sort(sortDates);
    const monthKeys = Object.keys(byMonth).sort();
    const monthValues = monthKeys.map(k => parseFloat(byMonth[k].toFixed(2)));
    const monthCounts = monthKeys.map(k => byMonthCount[k] ?? 0);

    this.monthCount.set(monthKeys.length);
    this.monthAvg.set(monthKeys.length ? monthValues.reduce((s, v) => s + v, 0) / monthKeys.length : 0);

    this.chartByDate?.destroy();
    this.chartByMonth?.destroy();
    this.chartByDate = null;
    this.chartByMonth = null;

    const baseOptions = (): ChartOptions<'bar'> => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 9 }, maxRotation: 40, autoSkip: false }, grid: { display: false } },
        y: { ticks: { callback: (v) => 'R$' + Math.round(v as number).toLocaleString('pt-BR'), font: { size: 9 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      },
    });

    if (dateKeys.length > 0) {
      this.chartByDate = new Chart(this.chartByDateRef.nativeElement, {
        type: 'bar',
        data: {
          labels: dateKeys,
          datasets: [{ label: 'Total pago na data', data: dateKeys.map(d => byDate[d]), backgroundColor: '#2d6a4f', borderRadius: 4 }],
        },
        options: baseOptions(),
      });
    }

    if (monthKeys.length > 0) {
      this.chartByMonth = new Chart(this.chartByMonthRef.nativeElement, {
        type: 'bar',
        data: {
          labels: monthKeys.map(getMonthLabel),
          datasets: [{ label: 'Total no mês', data: monthValues, backgroundColor: '#1a3d2e', borderRadius: 4 }],
        },
        options: {
          ...baseOptions(),
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                afterLabel: (ctx) => `${monthCounts[ctx.dataIndex]} parcela${monthCounts[ctx.dataIndex] !== 1 ? 's' : ''}`,
              },
            },
          },
        },
      });
    }
  }
}
