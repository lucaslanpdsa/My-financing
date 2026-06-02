import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

type AuthTab = 'login' | 'register';
type MsgType = 'error' | 'success' | '';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  private readonly auth = inject(AuthService);

  activeTab = signal<AuthTab>('login');
  msgText = signal('');
  msgType = signal<MsgType>('');
  isLoading = signal(false);

  loginEmail = '';
  loginPassword = '';
  registerName = '';
  registerEmail = '';
  registerPassword = '';

  switchTab(tab: AuthTab): void {
    this.activeTab.set(tab);
    this.clearMsg();
  }

  async onLogin(): Promise<void> {
    if (!this.loginEmail || !this.loginPassword) {
      return this.showMsg('Preencha e-mail e senha.', 'error');
    }
    this.isLoading.set(true);
    const error = await this.auth.login(this.loginEmail, this.loginPassword);
    this.isLoading.set(false);
    if (error) this.showMsg(error, 'error');
  }

  async onRegister(): Promise<void> {
    if (!this.registerName || !this.registerEmail || !this.registerPassword) {
      return this.showMsg('Preencha todos os campos.', 'error');
    }
    this.isLoading.set(true);
    const result = await this.auth.register(this.registerName, this.registerEmail, this.registerPassword);
    this.isLoading.set(false);
    if (result.error) this.showMsg(result.error, 'error');
    else if (result.success) this.showMsg(result.success, 'success');
  }

  async onForgotPassword(): Promise<void> {
    if (!this.loginEmail) {
      return this.showMsg('Digite seu e-mail para recuperar a senha.', 'error');
    }
    const error = await this.auth.forgotPassword(this.loginEmail);
    if (error) this.showMsg(error, 'error');
    else this.showMsg('E-mail de recuperação enviado!', 'success');
  }

  private showMsg(text: string, type: MsgType): void {
    this.msgText.set(text);
    this.msgType.set(type);
  }

  private clearMsg(): void {
    this.msgText.set('');
    this.msgType.set('');
  }
}
