import { Component, Input } from '@angular/core';

const CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'status-neutral' },
  pending_review: { label: 'Pending Review', className: 'status-warning' },
  pending: { label: 'Pending', className: 'status-warning' },
  approved: { label: 'Approved', className: 'status-success' },
  rejected: { label: 'Rejected', className: 'status-error' },
  published: { label: 'Published', className: 'status-success' },
  error: { label: 'error', className: 'status-error' },
  warning: { label: 'warning', className: 'status-warning' },
  neutral: { label: 'neutral', className: 'status-neutral' }
};

@Component({
  selector: 'status-badge',
  standalone: true,
  template: `<span class="status-badge {{ cfg.className }}">{{ cfg.label }}</span>`
})
export class StatusBadgeComponent {
  cfg = CONFIG['draft'];
  @Input() set status(s: string | undefined) {
    this.cfg = CONFIG[s ?? ''] ?? { label: s ?? '', className: 'status-neutral' };
  }
}
