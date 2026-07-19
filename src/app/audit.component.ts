import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from './data.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule],
  template: `
  <aside class="audit">
    <header>
      <h2>Audit ledger</h2>
      <span class="scope">{{ svc.selected().id }}</span>
    </header>
    <p class="hint">Immutable, write-once. Every upload, correction, reveal and sign-off lands here.</p>
    <ol>
      <li *ngFor="let e of events()">
        <div class="meta">
          <span class="act" [attr.data-a]="e.action">{{ label(e.action) }}</span>
          <span class="who">{{ e.actor }}</span>
          <time>{{ e.at }}</time>
        </div>
        <div class="delta" *ngIf="e.field">
          <span class="fld">{{ e.recordId }} · {{ e.field }}</span>
          <span class="vals" *ngIf="e.oldValue !== undefined">
            <s>{{ e.oldValue }}</s><span class="arrow">→</span><b>{{ e.newValue }}</b>
          </span>
        </div>
        <div class="note" *ngIf="e.note">{{ e.note }}</div>
      </li>
    </ol>
    <p class="empty" *ngIf="events().length === 0">No entries yet for this dataset.</p>
  </aside>
  `,
  styles: [`
    .audit { border-left: 1px solid var(--line); padding: 18px 16px; overflow-y: auto; background: #FBFCFA; }
    header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    h2 { font-family: var(--font-display); font-size: 14px; font-weight: 600; margin: 0; color: var(--ink); }
    .scope { font-family: var(--font-data); font-size: 10.5px; color: var(--text-dim); }
    .hint { font-size: 11px; color: var(--text-dim); margin: 6px 0 14px; }
    ol { list-style: none; margin: 0; padding: 0; }
    li { border-bottom: 1px solid var(--line); padding: 10px 0; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: baseline; }
    .act { font-family: var(--font-display); font-size: 10px; font-weight: 600; letter-spacing: .08em;
           text-transform: uppercase; padding: 2px 6px; border-radius: 3px; background: var(--surface); color: var(--text-dim); }
    .act[data-a="APPROVE"], .act[data-a="PUBLISH"] { background: var(--verdigris-soft); color: var(--verdigris); }
    .act[data-a="REJECT"], .act[data-a="PII_REVEAL"] { background: var(--claret-soft); color: var(--claret); }
    .act[data-a="EDIT"], .act[data-a="SUBMIT"] { background: var(--amber-soft); color: var(--amber); }
    .who { font-size: 12px; font-weight: 600; color: var(--ink-soft); }
    time { font-family: var(--font-data); font-size: 10.5px; color: var(--text-dim); margin-left: auto; }
    .delta { margin-top: 5px; font-family: var(--font-data); font-size: 11.5px; }
    .fld { color: var(--text-dim); display: block; }
    .vals s { color: var(--claret); text-decoration-color: var(--claret); }
    .arrow { margin: 0 6px; color: var(--text-dim); }
    .vals b { color: var(--verdigris); font-weight: 600; }
    .note { margin-top: 4px; font-size: 11.5px; color: var(--text-dim); }
    .empty { font-size: 12px; color: var(--text-dim); }
  `]
})
export class AuditComponent {
  svc = inject(DataService);
  events = computed(() => this.svc.audit().filter(e => e.datasetId === this.svc.selected().id));

  label(a: string) { return a.replace('_', ' ').toLowerCase(); }
}
