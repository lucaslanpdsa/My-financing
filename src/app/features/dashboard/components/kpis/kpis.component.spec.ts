import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpisComponent } from './kpis.component';
import { FinancingService } from '../../../../core/financing.service';
import { signal, computed } from '@angular/core';

describe('KpisComponent', () => {
  let fixture: ComponentFixture<KpisComponent>;

  const mockInstallments = signal([
    { num: 1, total: 3, value: 100, paid: true,  paidValue: 90,  paidDate: '01/01/2025' },
    { num: 2, total: 3, value: 100, paid: true,  paidValue: 100, paidDate: '02/01/2025' },
    { num: 3, total: 3, value: 100, paid: false, paidValue: 100, paidDate: null },
  ]);

  const mockFinancing = {
    installments: mockInstallments,
    paidInstallments:  computed(() => mockInstallments().filter(i => i.paid)),
    openInstallments:  computed(() => mockInstallments().filter(i => !i.paid)),
    totalPaid:         computed(() => 190),
    totalRemaining:    computed(() => 100),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpisComponent],
      providers: [{ provide: FinancingService, useValue: mockFinancing }],
    }).compileComponents();

    fixture = TestBed.createComponent(KpisComponent);
    fixture.detectChanges();
  });

  it('renders 4 kpi cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.kpi');
    expect(cards.length).toBe(4);
  });

  it('shows correct paid count', () => {
    const text = fixture.nativeElement.querySelector('.kpi-v.g').textContent;
    expect(text).toContain('2');
  });
});
