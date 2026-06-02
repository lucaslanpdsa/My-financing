import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressBarComponent } from './progress-bar.component';
import { FinancingService } from '../../../../core/financing.service';
import { signal, computed } from '@angular/core';

describe('ProgressBarComponent', () => {
  let fixture: ComponentFixture<ProgressBarComponent>;

  const mockInstallments = signal([
    { num: 1, total: 4, value: 100, paid: true,  paidValue: 100, paidDate: '01/01/2025' },
    { num: 2, total: 4, value: 100, paid: true,  paidValue: 100, paidDate: '02/01/2025' },
    { num: 3, total: 4, value: 100, paid: false, paidValue: 100, paidDate: null },
    { num: 4, total: 4, value: 100, paid: false, paidValue: 100, paidDate: null },
  ]);

  const mockFinancing = {
    installments:      mockInstallments,
    paidInstallments:  computed(() => mockInstallments().filter(i => i.paid)),
    percentPaid:       computed(() => 50),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressBarComponent],
      providers: [{ provide: FinancingService, useValue: mockFinancing }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.detectChanges();
  });

  it('shows correct percentage text', () => {
    const pct = fixture.nativeElement.querySelector('#prog-pct');
    expect(pct.textContent).toContain('50%');
  });

  it('sets fill width to percentage', () => {
    const fill = fixture.nativeElement.querySelector('#prog-fill');
    expect(fill.style.width).toBe('50%');
  });
});
