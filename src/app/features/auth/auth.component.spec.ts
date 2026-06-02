import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthComponent } from './auth.component';
import { AuthService } from '../../core/auth.service';
import { provideRouter } from '@angular/router';

const mockAuthService = {
  login: async () => null,
  register: async () => ({ success: 'ok' }),
  forgotPassword: async () => null,
};

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts on login tab', () => {
    expect(component.activeTab()).toBe('login');
  });

  it('switches to register tab', () => {
    component.switchTab('register');
    expect(component.activeTab()).toBe('register');
  });

  it('shows error when login fields are empty', async () => {
    await component.onLogin();
    expect(component.msgType()).toBe('error');
    expect(component.msgText()).toContain('Preencha');
  });

  it('shows error when register fields are empty', async () => {
    component.switchTab('register');
    await component.onRegister();
    expect(component.msgType()).toBe('error');
  });

  it('shows error for forgot password with no email', async () => {
    component.loginEmail = '';
    await component.onForgotPassword();
    expect(component.msgType()).toBe('error');
  });
});
