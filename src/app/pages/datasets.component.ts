import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../data.service';

@Component({
  selector: 'app-datasets',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Datasets</h1>
        <p>Everything currently staged for this tenant, newest first</p>
      </div>
      <a class="btn primary" routerLink="/upload" *ngIf="svc.user().role === 'DATA_STEWARD'">⇪ Upload dataset</a>
    </div>

    <div class="chips">
      <button *ngFor="let f of filters" [class.on]="filter() === f.value" (click)="setFilter(f.value)">
        {{ f.label }}
      </button>
    </div>

    <table class="list">
      <thead>
        <tr><th>Dataset</th><th>Source</th><th>Size</th><th>Records</th><th>Flagged</th><th>Status</th><th>Uploaded</th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let d of visible()" (click)="open(d.id)" style="cursor:pointer">
          <td>
            <span class="mono nm">{{ d.name }}</span><br>
            <span class="mono id">{{ d.id }}</span>
          </td>
          <td class="dim">{{ d.source }}</td>
          <td class="mono dim">{{ d.sizeLabel }}</td>
          <td class="mono">{{ d.recordCount }}</td>
          <td><span class="mono" [class.flag]="d.flaggedCount > 0">{{ d.flaggedCount }}</span></td>
          <td><span class="pill" [ngClass]="d.status.toLowerCase()">{{ d.status.replace('_',' ') }}</span></td>
          <td class="mono dim">{{ d.uploadedAt.slice(0, 10) }}<br>by {{ d.uploadedBy }}</td>
        </tr>
      </tbody>
    </table>
    <p class="empty" *ngIf="visible().length === 0">No datasets match this filter yet. Upload one to get started.</p>
  </div>
  `,
  styles: [`
    .chips { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .chips button { border: 1px solid var(--line-strong); background: var(--cell); color: var(--text-dim);
                    border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 600; }
    .chips button.on { border-color: var(--verdigris); color: var(--verdigris); background: var(--verdigris-soft); }
    .nm { font-weight: 600; font-size: 12.5px; }
    .id { font-size: 10.5px; color: var(--text-dim); }
    .dim { color: var(--text-dim); font-size: 12px; }
    .flag { color: var(--amber); font-weight: 600; }
    .empty { color: var(--text-dim); font-size: 13px; margin-top: 16px; }
  `]
})
export class DatasetsComponent {
  svc = inject(DataService);
  private router = inject(Router);

  filters = [
    { label: 'All', value: 'ALL' },
    { label: 'In review', value: 'IN_REVIEW' },
    { label: 'Pending approval', value: 'PENDING_APPROVAL' },
    { label: 'Published', value: 'PUBLISHED' }
  ];
  filter = signal<string>('ALL');

  constructor(route: ActivatedRoute) {
    const q = route.snapshot.queryParamMap.get('status');
    if (q) this.filter.set(q);
  }

  setFilter(v: string) { this.filter.set(v); }

  visible = computed(() => {
    const f = this.filter();
    const list = this.svc.datasets();
    return f === 'ALL' ? list : list.filter(d => d.status === f);
  });

  open(id: string) { this.router.navigate(['/datasets', id]); }
}
