// src/app/features/home/home.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { AuthService } from '../../core/auth.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

const mockAuth = {
  currentUser: signal({ id: 'u1', email: 'user@test.com' } as any),
  logout: async () => {},
};

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('renders two feature cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.feature-card');
    expect(cards.length).toBe(2);
  });

  it('first card links to /financiamento', () => {
    const cards = fixture.nativeElement.querySelectorAll('.feature-card');
    expect(cards[0].getAttribute('href')).toBe('/financiamento');
  });

  it('second card links to /despesas', () => {
    const cards = fixture.nativeElement.querySelectorAll('.feature-card');
    expect(cards[1].getAttribute('href')).toBe('/despesas');
  });
});
