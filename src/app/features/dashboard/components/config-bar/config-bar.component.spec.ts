import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigBarComponent } from './config-bar.component';
import { FinancingService } from '../../../../core/financing.service';
import { AuthService } from '../../../../core/auth.service';
import { signal } from '@angular/core';
import { SaveStatus } from '../../../../core/models';

describe('ConfigBarComponent', () => {
  let component: ConfigBarComponent;
  let fixture: ComponentFixture<ConfigBarComponent>;

  const saveStatus = signal<SaveStatus>('idle');

  const mockFinancing = {
    config: signal({ totalInstallments: 36, installmentValue: 795.18, financedAmount: 20000 }),
    installments: signal([]),
    saveStatus,
    setSaveStatus: () => {},
    saveConfig: async () => {},
    saveAllInstallments: async () => {},
    deleteInstallmentsFrom: async () => {},
    paidInstallments: signal([]),
  };

  const mockAuth = {
    currentUser: signal({ id: 'user-1', email: 'test@test.com' } as any),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigBarComponent],
      providers: [
        { provide: FinancingService, useValue: mockFinancing },
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads config values on init', () => {
    expect(component.cfgTotal()).toBe(36);
    expect(component.cfgValue()).toBe(795.18);
    expect(component.cfgFinanced()).toBe(20000);
  });

  it('saveLabel returns empty string when idle', () => {
    saveStatus.set('idle');
    expect(component.saveLabel).toBe('');
  });

  it('saveLabel returns Salvando when saving', () => {
    saveStatus.set('saving');
    expect(component.saveLabel).toBe('Salvando...');
    saveStatus.set('idle');
  });
});
