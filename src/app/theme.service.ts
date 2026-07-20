import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<'light' | 'dark'>((localStorage.getItem('theme') as any) || 'light');

  constructor() { this.apply(this.theme()); }

  setTheme(t: 'light' | 'dark') {
    this.theme.set(t);
    this.apply(t);
    localStorage.setItem('theme', t);
  }

  toggleTheme() { this.setTheme(this.theme() === 'light' ? 'dark' : 'light'); }

  private apply(t: string) {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
  }
}
