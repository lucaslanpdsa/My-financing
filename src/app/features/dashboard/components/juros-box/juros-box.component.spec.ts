import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JurosBoxComponent } from './juros-box.component';
import { FinancingService } from '../../../../core/financing.service';
import { signal, computed } from '@angular/core';

describe('JurosBoxComponent', () => {
  let component: JurosBoxComponent;
  let fixture: ComponentFixture<JurosBoxComponent>;

  const installments = signal([
    { num: 1, total: 2, value: 100, paid: true, paidValue: 90, paidDate: '01/01/2025' },
    { num: 2, total: 2, value: 100, paid: false, paidValue: 100, paidDate: null },
  ]);

  const mockFinancing = {
    config: signal({ totalInstallments: 2, installmentValue: 100, financedAmount: 180 }),
    installments,
    faceTotal: computed(() => 200),
    totalInterest: computed(() => 20),
    totalDiscount: computed(() => 10),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JurosBoxComponent],
      providers: [{ provide: FinancingService, useValue: mockFinancing }],
    }).compileComponents();

    fixture = TestBed.createComponent(JurosBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('calculates effectiveCost correctly', () => {
    // (200/180 - 1) * 100 ≈ 11.11
    expect(component.effectiveCost()).toBeCloseTo(11.11, 1);
  });

  it('calculates annualRate from monthlyRate', () => {
    expect(component.annualRate()).toBeGreaterThan(0);
  });
});
