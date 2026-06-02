import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartsComponent } from './charts.component';
import { FinancingService } from '../../../../core/financing.service';
import { signal, computed } from '@angular/core';

// jsdom does not implement canvas — stub getContext so Chart.js does not throw
HTMLCanvasElement.prototype.getContext = () => null;

describe('ChartsComponent', () => {
  let component: ChartsComponent;
  let fixture: ComponentFixture<ChartsComponent>;

  const mockInstallments = signal([
    { num: 1, total: 2, value: 100, paid: true, paidValue: 100, paidDate: '01/01/2025' },
    { num: 2, total: 2, value: 100, paid: true, paidValue: 100, paidDate: '01/02/2025' },
  ]);

  const mockFinancing = {
    paidInstallments: computed(() => mockInstallments()),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartsComponent],
      providers: [{ provide: FinancingService, useValue: mockFinancing }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders two canvas elements', () => {
    const canvases = fixture.nativeElement.querySelectorAll('canvas');
    expect(canvases.length).toBe(2);
  });

  it('calculates monthAvg and monthCount correctly', () => {
    expect(component.monthAvg()).toBe(100);
    expect(component.monthCount()).toBe(2);
  });
});
