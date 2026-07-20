import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Audit logs</h1>
        <p>Append-only ledger for the whole tenant — INSERT and SELECT only, no updates, no deletes</p>
      </div>
    </div>

    <div class="chips">
      <button [class.on]="filter() === 'ALL'" (click)="filter.set('ALL')">All</button>
      <button *ngFor="let a of actions" [class.on]="filter() === a" (click)="filter.set(a)">
        {{ a.replace('_',' ').toLowerCase() }}
      </button>
    </div>

    <table class="list">
      <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Dataset</th><th>Detail</th></tr></thead>
      <tbody>
        <tr *ngFor="let e of visible()">
          <td class="mono dim">{{ e.at }}</td>
          <td><b>{{ e.actor }}</b><br><span class="dim small">{{ e.role.replace('_',' ').toLowerCase() }}</span></td>
          <td><span class="act" [attr.data-a]="e.action">{{ e.action.replace('_',' ').toLowerCase() }}</span></td>
          <td class="mono dim">{{ e.datasetId }}</td>
          <td>
            <span class="mono" *ngIf="e.field">{{ e.recordId }} · {{ e.field }}:
              <s>{{ e.oldValue }}</s> <span class="dim">→</span> <b class="new">{{ e.newValue }}</b></span>
            <span class="dim" *ngIf="e.note"> {{ e.note }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  `,
  styles: [`
    .chips { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .chips button { border: 1px solid var(--line-strong); background: var(--cell); color: var(--text-dim);
                    border-radius: 20px; padding: 5px 14px; font-size: 12px; font-weight: 600; }
    .chips button.on { border-color: var(--verdigris); color: var(--verdigris); background: var(--verdigris-soft); }
    .dim { color: var(--text-dim); }
    .small { font-size: 10.5px; }
    td .mono { font-size: 12px; }
    .act { font-family: var(--font-display); font-size: 9.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
           padding: 2px 7px; border-radius: 3px; background: var(--surface); color: var(--text-dim); white-space: nowrap; }
    .act[data-a="APPROVE"], .act[data-a="PUBLISH"] { background: var(--verdigris-soft); color: var(--verdigris); }
    .act[data-a="REJECT"], .act[data-a="PII_REVEAL"] { background: var(--claret-soft); color: var(--claret); }
    .act[data-a="EDIT"], .act[data-a="SUBMIT"], .act[data-a="UPLOAD"] { background: var(--amber-soft); color: var(--amber); }
    s { color: var(--claret); text-decoration-color: var(--claret); }
    .new { color: var(--verdigris); }
  `]
})
export class AuditPageComponent {
  svc = inject(DataService);
  actions = ['UPLOAD', 'EDIT', 'SUBMIT', 'APPROVE', 'REJECT', 'PUBLISH', 'PII_REVEAL'];
  filter = signal<string>('ALL');

  visible = computed(() => {
    const f = this.filter();
    const list = this.svc.audit();
    return f === 'ALL' ? list : list.filter(e => e.action === f);
  });
}
