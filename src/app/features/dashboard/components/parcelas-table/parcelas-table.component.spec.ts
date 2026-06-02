import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParcelasTableComponent } from './parcelas-table.component';
import { FinancingService } from '../../../../core/financing.service';
import { AuthService } from '../../../../core/auth.service';
import { signal, computed } from '@angular/core';

describe('ParcelasTableComponent', () => {
  let component: ParcelasTableComponent;
  let fixture: ComponentFixture<ParcelasTableComponent>;

  const mockInstallments = signal([
    { num: 1, total: 2, value: 100, paid: true,  paidValue:  90, paidDate: '15/01/2025' },
    { num: 2, total: 2, value: 100, paid: false, paidValue: 100, paidDate: null },
  ]);

  const mockFinancing = {
    installments:     mockInstallments,
    paidInstallments: computed(() => mockInstallments().filter(i => i.paid)),
    totalPaid:        computed(() => 90),
    totalDiscount:    computed(() => 10),
    saveStatus:       signal('idle' as const),
    setSaveStatus:    () => {},
    saveInstallment:  async () => {},
  };

  const mockAuth = {
    currentUser: signal({ id: 'user-1' } as any),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParcelasTableComponent],
      providers: [
        { provide: FinancingService, useValue: mockFinancing },
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParcelasTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders correct number of rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('#tbody tr');
    expect(rows.length).toBe(2);
  });

  it('converts paidDate to input value format', () => {
    expect(component.dateToInputValue('15/01/2025')).toBe('2025-01-15');
  });

  it('returns empty string for null paidDate', () => {
    expect(component.dateToInputValue(null)).toBe('');
  });

  it('calculates totalValue correctly', () => {
    expect(component.totalValue()).toBe(200);
  });

  it('togglePaid flips paid state', async () => {
    await component.togglePaid(1);
    expect(mockInstallments()[1].paid).toBe(true);
    // restore
    await component.togglePaid(1);
  });
});
