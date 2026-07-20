import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { GridComponent } from '../grid.component';
import { AuditComponent } from '../audit.component';

@Component({
  selector: 'app-dataset-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, GridComponent, AuditComponent],
  template: `
  <div class="page wide" *ngIf="svc.selected() as ds">
    <a routerLink="/datasets" class="back">← All datasets</a>

    <div class="page-head">
      <div>
        <h1 class="mono">{{ ds.name }}</h1>
        <p>{{ ds.id }} · {{ ds.sizeLabel }} · {{ ds.recordCount }} records, {{ ds.flaggedCount }} flagged ·
           uploaded {{ ds.uploadedAt }} by {{ ds.uploadedBy }}</p>
      </div>
      <div class="actions">
        <ng-container [ngSwitch]="ds.status">
          <ng-container *ngSwitchCase="'IN_REVIEW'">
            <button class="btn primary" *ngIf="svc.user().role === 'DATA_STEWARD'" (click)="svc.submitForApproval()">
              Submit for approval</button>
            <span class="ro" *ngIf="svc.user().role !== 'DATA_STEWARD'">Read-only — corrections need the Data Steward role</span>
          </ng-container>
          <ng-container *ngSwitchCase="'PENDING_APPROVAL'">
            <ng-container *ngIf="svc.user().role === 'APPROVER'; else waiting">
              <button class="btn primary" (click)="svc.approve()">Approve &amp; publish to lake</button>
              <button class="btn danger" (click)="svc.reject()">Reject</button>
            </ng-container>
            <ng-template #waiting><span class="ro">Locked — awaiting second-person approval</span></ng-template>
          </ng-container>
          <ng-container *ngSwitchCase="'PUBLISHED'">
            <span class="published">✓ Published · Iceberg snapshot <code>{{ ds.snapshotId }}</code></span>
          </ng-container>
        </ng-container>
      </div>
    </div>

    <section class="diff card" *ngIf="ds.status === 'PENDING_APPROVAL' && svc.pendingEdits(ds).length > 0">
      <h3>Corrections awaiting sign-off</h3>
      <div class="diff-row" *ngFor="let e of svc.pendingEdits(ds)">
        <span class="fld mono">{{ e.recordId }} · {{ e.field }}</span>
        <span class="vals mono"><s>{{ e.from }}</s><span class="arrow">→</span><b>{{ e.to }}</b></span>
      </div>
    </section>

    <div class="body">
      <div class="main">
        <app-grid></app-grid>
        <footer class="foot">
          Staging: <code>postgres://stage/{{ svc.user().tenant }}</code> · Target:
          <code>lake.alpha_bank.customer_master</code> (Iceberg on S3) · Edits are audited field-by-field.
        </footer>
      </div>
      <app-audit></app-audit>
    </div>
  </div>
  `,
  styles: [`
    .wide { max-width: none; }
    .back { display: inline-block; font-size: 12px; color: var(--text-dim); text-decoration: none; margin-bottom: 10px; }
    .back:hover { color: var(--verdigris); }
    h1.mono { font-family: var(--font-data); font-size: 19px; }
    .actions { display: flex; gap: 8px; align-items: center; }
    .ro { font-size: 12px; color: var(--text-dim); border: 1px dashed var(--line-strong); border-radius: 6px; padding: 7px 12px; }
    .published { font-family: var(--font-data); font-size: 12px; color: var(--verdigris); }
    .published code { background: var(--verdigris-soft); border-radius: 4px; padding: 2px 6px; }

    .diff { margin-bottom: 14px; }
    .diff h3 { font-family: var(--font-display); font-size: 12.5px; font-weight: 600; margin: 0 0 8px; color: var(--ink-soft); }
    .diff-row { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; padding: 4px 0; border-top: 1px dashed var(--line); }
    .diff-row .fld { color: var(--text-dim); min-width: 200px; }
    .diff-row s { color: var(--claret); text-decoration-color: var(--claret); }
    .arrow { margin: 0 6px; color: var(--text-dim); }
    .diff-row b { color: var(--verdigris); }

    .body { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 14px; align-items: start; }
    app-audit { display: block; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; max-height: 72vh; }
    .foot { font-size: 11px; color: var(--text-dim); margin-top: 10px; }
    .foot code { font-family: var(--font-data); background: var(--cell); border: 1px solid var(--line); border-radius: 4px; padding: 1px 5px; }

    @media (max-width: 1000px) { .body { grid-template-columns: 1fr; } }
  `]
})
export class DatasetDetailComponent {
  svc = inject(DataService);

  constructor(route: ActivatedRoute) {
    route.paramMap.subscribe(p => {
      const id = p.get('id');
      if (id && this.svc.datasetById(id)) this.svc.select(id);
    });
  }
}
