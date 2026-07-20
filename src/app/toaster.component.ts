import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2">
    <div class="toast-item" *ngFor="let t of svc.toasts()" (click)="svc.dismiss(t.id)">
      <i-lucide [name]="t.kind === 'success' ? 'check-circle' : 'alert-circle'"
        [class]="'h-4 w-4 mt-0.5 ' + (t.kind === 'success' ? 'text-emerald-600' : 'text-red-600')"></i-lucide>
      <span>{{ t.message }}</span>
    </div>
  </div>`
})
export class ToasterComponent { svc = inject(ToastService); }
