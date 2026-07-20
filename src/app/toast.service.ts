import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; kind: 'success' | 'error'; message: string; }
let seq = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string) { this.push('success', message); }
  error(message: string) { this.push('error', message); }

  private push(kind: Toast['kind'], message: string) {
    const t: Toast = { id: ++seq, kind, message };
    this.toasts.update(list => [...list, t]);
    setTimeout(() => this.dismiss(t.id), 4000);
  }

  dismiss(id: number) { this.toasts.update(list => list.filter(t => t.id !== id)); }
}
