import { TestBed } from '@angular/core/testing';
import { FinancingService } from './financing.service';
import { SupabaseService } from './supabase.service';

const mockSupabaseClient = {
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    upsert: async () => ({ error: null }),
    delete: () => ({ eq: () => ({ gte: async () => ({ error: null }) }) }),
  }),
};

describe('FinancingService', () => {
  let service: FinancingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FinancingService,
        { provide: SupabaseService, useValue: { client: mockSupabaseClient } },
      ],
    });
    service = TestBed.inject(FinancingService);
  });

  it('initInstallments creates the correct number of installments', () => {
    service.initInstallments(5, 200);
    expect(service.installments().length).toBe(5);
    expect(service.installments()[0]).toEqual({
      num: 1, total: 5, value: 200, paid: false, paidValue: 200, paidDate: null,
    });
  });

  it('paidInstallments filters only paid ones', () => {
    service.installments.set([
      { num: 1, total: 3, value: 100, paid: true,  paidValue: 100, paidDate: '01/01/2025' },
      { num: 2, total: 3, value: 100, paid: false, paidValue: 100, paidDate: null },
      { num: 3, total: 3, value: 100, paid: true,  paidValue:  90, paidDate: '02/01/2025' },
    ]);
    expect(service.paidInstallments().length).toBe(2);
  });

  it('totalPaid sums paidValue of paid installments', () => {
    service.installments.set([
      { num: 1, total: 3, value: 100, paid: true,  paidValue:  90, paidDate: '01/01/2025' },
      { num: 2, total: 3, value: 100, paid: true,  paidValue: 100, paidDate: '02/01/2025' },
      { num: 3, total: 3, value: 100, paid: false, paidValue: 100, paidDate: null },
    ]);
    expect(service.totalPaid()).toBe(190);
  });

  it('percentPaid calculates correct percentage', () => {
    service.installments.set([
      { num: 1, total: 3, value: 100, paid: true,  paidValue: 100, paidDate: '01/01/2025' },
      { num: 2, total: 3, value: 100, paid: false, paidValue: 100, paidDate: null },
      { num: 3, total: 3, value: 100, paid: false, paidValue: 100, paidDate: null },
    ]);
    expect(service.percentPaid()).toBe(33);
  });

  it('totalDiscount sums discounts from paid installments', () => {
    service.installments.set([
      { num: 1, total: 2, value: 100, paid: true, paidValue: 80, paidDate: '01/01/2025' },
      { num: 2, total: 2, value: 100, paid: true, paidValue: 95, paidDate: '02/01/2025' },
    ]);
    expect(service.totalDiscount()).toBe(25);
  });

  it('setSaveStatus sets status and clears after delay', async () => {
    service.setSaveStatus('saving');
    expect(service.saveStatus()).toBe('saving');

    service.setSaveStatus('saved', 50);
    expect(service.saveStatus()).toBe('saved');
    await new Promise(r => setTimeout(r, 100));
    expect(service.saveStatus()).toBe('idle');
  });
});
