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

  readonly session = this.sessionSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();

  constructor() {
    void this.loadSession();

    supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionSignal.set(session);
      this.userSignal.set(session?.user ?? null);
    });
  }

  async loadSession(): Promise<void> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      this.clearLocalSession();
      return;
    }

    if (!this.isLoginFromToday()) {
      await this.signOut();
      return;
    }

    this.sessionSignal.set(data.session);
    this.userSignal.set(data.session.user);
  }

  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    this.saveTodayLoginDate();

    this.sessionSignal.set(data.session);
    this.userSignal.set(data.user);
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    this.clearLocalSession();
  }

  async isAuthenticated(): Promise<boolean> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      this.clearLocalSession();
      return false;
    }

    if (!this.isLoginFromToday()) {
      await this.signOut();
      return false;
    }

    this.sessionSignal.set(data.session);
    this.userSignal.set(data.session.user);

    return true;
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
    return new Date().toISOString().split('T')[0];
  }

  private clearLocalSession(): void {
    sessionStorage.removeItem(this.loginDateStorageKey);
    this.sessionSignal.set(null);
    this.userSignal.set(null);
  }
}
