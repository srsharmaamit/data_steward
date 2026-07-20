import { Injectable, signal } from '@angular/core';

const KEY = 'dsh.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<'light' | 'dark'>(this.restore());

  constructor() { this.apply(this.theme()); }

  private restore(): 'light' | 'dark' {
    try { return (localStorage.getItem(KEY) as 'light' | 'dark') || 'light'; }
    catch { return 'light'; }
  }

  toggle() { this.set(this.theme() === 'light' ? 'dark' : 'light'); }

  set(t: 'light' | 'dark') {
    this.theme.set(t);
    this.apply(t);
    try { localStorage.setItem(KEY, t); } catch {}
  }

  private apply(t: string) {
    document.documentElement.setAttribute('data-theme', t);
  }
}
