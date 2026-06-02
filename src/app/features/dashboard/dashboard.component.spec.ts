import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/auth.service';
import { FinancingService } from '../../core/financing.service';
import { signal, computed } from '@angular/core';
import { provideRouter } from '@angular/router';

const mockInstallments = signal([]);

const mockFinancing = {
  installments:     mockInstallments,
  paidInstallments: computed(() => []),
  openInstallments: computed(() => []),
  totalPaid:        computed(() => 0),
  totalRemaining:   computed(() => 0),
  totalPaidValue:   computed(() => 0),
  totalDiscount:    computed(() => 0),
  faceTotal:        computed(() => 0),
  totalInterest:    computed(() => 0),
  percentPaid:      computed(() => 0),
  config:           signal({ totalInstallments: 36, installmentValue: 0, financedAmount: 0 }),
  saveStatus:       signal('idle' as const),
  setSaveStatus:    () => {},
  loadUserData:     async () => {},
  saveConfig:       async () => {},
  saveAllInstallments: async () => {},
  saveInstallment:  async () => {},
  deleteInstallmentsFrom: async () => {},
  initInstallments: () => {},
};

const mockAuth = {
  currentUser: signal({ id: 'user-1', email: 'test@test.com' } as any),
  logout: async () => {},
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
        { provide: FinancingService, useValue: mockFinancing },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows loading state initially', () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#app-loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#app-content')).toBeFalsy();
  });

  it('shows content when not loading', async () => {
    await fixture.whenStable();
    component.isLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#app-content')).toBeTruthy();
  });

  it('displays user email in topbar', async () => {
    await fixture.whenStable();
    component.isLoading.set(false);
    fixture.detectChanges();
    const emailEl = fixture.nativeElement.querySelector('#user-email');
    expect(emailEl.textContent.trim()).toBe('test@test.com');
  });
});
