import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseService).client;
  private readonly router = inject(Router);

  readonly currentUser = signal<User | null>(null);
  readonly accessToken = signal<string | null>(null);

  private readonly _sessionReady: Promise<void>;
  private _resolveSession!: () => void;

  constructor() {
    this._sessionReady = new Promise(resolve => { this._resolveSession = resolve; });

    this.sb.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.access_token) this.accessToken.set(session.access_token);
        return;
      }

      if (session?.user) {
        this.currentUser.set(session.user);
        this.accessToken.set(session.access_token ?? null);
        if (event === 'SIGNED_IN') this.router.navigate(['/dashboard']);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser.set(null);
        this.accessToken.set(null);
        this.router.navigate(['/auth']);
      }

      // Resolve on first definitive event so consumers can await session restoration
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        this._resolveSession();
      }
    });
  }

  waitForAuth(): Promise<void> {
    return this._sessionReady;
  }

  async login(email: string, password: string): Promise<string | null> {
    const { error } = await this.sb.auth.signInWithPassword({ email, password });
    if (!error) return null;
    return error.message === 'Invalid login credentials'
      ? 'E-mail ou senha incorretos.'
      : error.message;
  }

  async register(name: string, email: string, password: string): Promise<{ error?: string; success?: string }> {
    if (password.length < 6) return { error: 'A senha deve ter ao menos 6 caracteres.' };
    const { error } = await this.sb.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };
    return { success: 'Conta criada! Verifique seu e-mail para confirmar.' };
  }

  async forgotPassword(email: string): Promise<string | null> {
    const { error } = await this.sb.auth.resetPasswordForEmail(email);
    return error ? error.message : null;
  }

  async logout(): Promise<void> {
    try { await this.sb.auth.signOut(); } catch { /* ignore */ }
  }
}
