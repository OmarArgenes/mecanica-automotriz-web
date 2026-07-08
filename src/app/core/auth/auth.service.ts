import { Injectable, signal } from '@angular/core';
import { Session, User } from '@supabase/supabase-js';

import { supabase } from '../supabase/supabase.client';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly sessionSignal = signal<Session | null>(null);
  private readonly userSignal = signal<User | null>(null);

  private readonly loginDateStorageKey = 'workshop_login_date';
  private readonly initializationPromise: Promise<void>;

  readonly session = this.sessionSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();

  constructor() {
    this.initializationPromise = this.initializeAuth();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.initializationPromise;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    this.saveTodayLoginDate();
    this.applySession(data.session);
  }

  async signOut(): Promise<void> {
    await this.initializationPromise;

    const { error } = await supabase.auth.signOut();
    this.clearLocalSession();

    if (error) {
      throw new Error(error.message);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    await this.initializationPromise;

    const session = this.sessionSignal();

    if (!session) {
      return false;
    }

    if (!this.isLoginFromToday()) {
      await this.signOut();
      return false;
    }

    return true;
  }

  private async initializeAuth(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        this.clearLocalSession();
        return;
      }

      if (!this.isLoginFromToday()) {
        const { error: signOutError } = await supabase.auth.signOut();
        this.clearLocalSession();

        if (signOutError) {
          console.error(
            'No se pudo cerrar una sesión anterior durante la inicialización.',
            signOutError,
          );
        }

        return;
      }

      this.applySession(data.session);
    } catch (error) {
      this.clearLocalSession();
      console.error('No se pudo inicializar la sesión de autenticación.', error);
    } finally {
      supabase.auth.onAuthStateChange((_event, session) => {
        this.applySession(session);
      });
    }
  }

  private applySession(session: Session | null): void {
    this.sessionSignal.set(session);
    this.userSignal.set(session?.user ?? null);
  }

  private saveTodayLoginDate(): void {
    sessionStorage.setItem(this.loginDateStorageKey, this.getTodayKey());
  }

  private isLoginFromToday(): boolean {
    return (
      sessionStorage.getItem(this.loginDateStorageKey) === this.getTodayKey()
    );
  }

  private getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private clearLocalSession(): void {
    sessionStorage.removeItem(this.loginDateStorageKey);
    this.applySession(null);
  }
}
