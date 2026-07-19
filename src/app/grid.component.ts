import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from './data.service';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="grid-wrap" *ngIf="svc.selected() as ds">
    <table class="grid">
      <thead>
        <tr>
          <th class="rowid">Record</th>
          <th *ngFor="let c of ds.columns">
            {{ c.label }}
            <span class="pii-tag" *ngIf="c.pii" title="Tagged PII in the metadata store">PII</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of ds.records">
          <td class="rowid">{{ r.id }}</td>
          <td *ngFor="let c of ds.columns"
              [class.flagged]="r.flags[c.key]"
              [class.corrected]="r.edited[c.key] !== undefined"
              [class.num]="c.type === 'number'">

            <ng-container *ngIf="c.pii && !svc.user().piiAccess; else valueTpl">
              <span class="masked" title="Requires PII_ACCESS role">••••••••</span>
            </ng-container>

            <ng-template #valueTpl>
              <ng-container *ngIf="c.pii && !revealed[r.id + c.key] && svc.user().piiAccess; else editTpl">
                <button class="mask-btn" (click)="reveal(r.id, c.key)" title="Reveal — logged to the audit trail">
                  ••••••••
                </button>
              </ng-container>
              <ng-template #editTpl>
                <ng-container *ngIf="svc.canEdit() && c.editable; else readTpl">
                  <input class="cell-input"
                         [ngModel]="r.values[c.key]"
                         (ngModelChange)="draft[r.id + c.key] = $event"
                         (blur)="commit(r.id, c.key)"
                         (keydown.enter)="commit(r.id, c.key); $any($event.target).blur()">
                </ng-container>
                <ng-template #readTpl>
                  <span class="cell-val">{{ r.values[c.key] }}</span>
                </ng-template>
              </ng-template>
            </ng-template>

            <div class="strike" *ngIf="r.edited[c.key] !== undefined && (!c.pii || revealed[r.id + c.key] || !svc.user().piiAccess)">
              <s>{{ svc.user().piiAccess || !c.pii ? r.edited[c.key] : '••••••••' }}</s>
            </div>
            <div class="flag-note" *ngIf="r.flags[c.key]">⚑ {{ r.flags[c.key] }}</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  `,
  styles: [`
    .grid-wrap { overflow: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--cell); }
    table.grid { border-collapse: collapse; width: 100%; min-width: 980px; }
    th { font-family: var(--font-display); font-size: 11.5px; font-weight: 600; letter-spacing: .06em;
         text-transform: uppercase; color: var(--text-dim); text-align: left; padding: 10px 12px;
         border-bottom: 1.5px solid var(--line-strong); background: #FBFCFA; position: sticky; top: 0; white-space: nowrap; }
    td { border-bottom: 1px solid var(--line); padding: 8px 12px; font-family: var(--font-data); font-size: 12.5px; vertical-align: top; }
    td.num, td.num .cell-input { text-align: right; }
    .rowid { color: var(--text-dim); font-family: var(--font-data); font-size: 11.5px; white-space: nowrap; }
    .pii-tag { display: inline-block; margin-left: 6px; padding: 1px 5px; border-radius: 3px; font-size: 9.5px;
               letter-spacing: .08em; background: var(--claret-soft); color: var(--claret); border: 1px solid #E5C4C6; }
    td.flagged { background: var(--amber-soft); }
    td.corrected { box-shadow: inset 3px 0 0 var(--verdigris); background: var(--verdigris-soft); }
    .cell-input { width: 100%; min-width: 110px; border: 1px solid transparent; border-radius: 4px; padding: 3px 5px;
                  font-size: 12.5px; background: transparent; }
    .cell-input:hover { border-color: var(--line-strong); background: var(--cell); }
    .cell-input:focus { border-color: var(--verdigris); background: var(--cell); outline: none; }
    .masked { color: var(--text-dim); letter-spacing: .12em; }
    .mask-btn { border: 1px dashed var(--line-strong); background: transparent; border-radius: 4px;
                color: var(--text-dim); letter-spacing: .12em; padding: 3px 8px; font-family: var(--font-data); font-size: 12px; }
    .mask-btn:hover { border-color: var(--claret); color: var(--claret); }
    .strike { margin-top: 2px; }
    .strike s { color: var(--claret); font-size: 11px; text-decoration-color: var(--claret); }
    .flag-note { margin-top: 3px; font-family: var(--font-body); font-size: 11px; color: var(--amber); max-width: 240px; }
  `]
})
export class GridComponent {
  svc = inject(DataService);
  revealed: { [k: string]: boolean } = {};
  draft: { [k: string]: string } = {};

  reveal(recordId: string, field: string) {
    this.revealed[recordId + field] = true;
    this.svc.logPiiReveal(recordId, field);
  }

  commit(recordId: string, field: string) {
    const k = recordId + field;
    if (this.draft[k] !== undefined) {
      this.svc.editCell(recordId, field, this.draft[k]);
      delete this.draft[k];
    }
  }
}
