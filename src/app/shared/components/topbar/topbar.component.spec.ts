// src/app/shared/components/topbar/topbar.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopbarComponent } from './topbar.component';
import { AuthService } from '../../../core/auth.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

const mockAuth = {
  currentUser: signal({ id: 'u1', email: 'test@test.com' } as any),
  logout: vi.fn().mockResolvedValue(undefined),
};

describe('TopbarComponent', () => {
  let component: TopbarComponent;
  let fixture: ComponentFixture<TopbarComponent>;

  beforeEach(() => {
    mockAuth.logout.mockClear();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the logo text', () => {
    const logo = fixture.nativeElement.querySelector('.topbar-logo');
    expect(logo.textContent).toContain('Financiamento');
  });

  it('renders user email', () => {
    const email = fixture.nativeElement.querySelector('#user-email');
    expect(email.textContent.trim()).toBe('test@test.com');
  });

  it('calls logout when Sair is clicked', async () => {
    const btn = fixture.nativeElement.querySelector('.btn-logout');
    btn.click();
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('renders three nav links', () => {
    const links = fixture.nativeElement.querySelectorAll('.nav-link');
    expect(links.length).toBe(3);
  });
});
