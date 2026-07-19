import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from './data.service';
import { GridComponent } from './grid.component';
import { AuditComponent } from './audit.component';
import { Role } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, GridComponent, AuditComponent],
  template: `
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="mark">DS</span>
        <span class="name">DataSteward <em>Hub</em></span>
      </div>
      <span class="tenant" title="Isolated Kubernetes namespace per tenant">◈ {{ svc.user().tenant }}</span>
      <div class="idbox">
        <label for="role">Signed in as</label>
        <select id="role" [ngModel]="svc.user().role" (ngModelChange)="setRole($event)">
          <option value="DATA_STEWARD">A. Sharma — Data Steward</option>
          <option value="APPROVER">M. Boyd — Approver</option>
          <option value="ANALYST">R. Chen — Analyst (no PII)</option>
        </select>
      </div>
    </header>

    <nav class="rail">
      <div class="rail-head">
        <h2>Staging queue</h2>
        <button class="upload" (click)="svc.simulateUpload()" [disabled]="svc.user().role !== 'DATA_STEWARD'"
                title="Streams large files to staging in parts via pre-signed URLs">＋ Upload</button>
      </div>
      <ul>
        <li *ngFor="let d of svc.datasets()"
            [class.active]="d.id === svc.selectedId()">
          <button (click)="svc.select(d.id)">
            <span class="ds-name">{{ d.name }}</span>
            <span class="ds-meta">{{ d.id }} · {{ d.sizeLabel }}</span>
            <span class="ds-meta">{{ d.source }}</span>
            <span class="status" [attr.data-s]="d.status">{{ statusLabel(d.status) }}</span>
          </button>
        </li>
      </ul>
    </nav>

    <main class="work" *ngIf="svc.selected() as ds">
      <div class="workflow">
        <div class="ds-title">
          <h1>{{ ds.name }}</h1>
          <p>{{ ds.recordCount }} records staged · {{ ds.flaggedCount }} flagged by validation ·
             uploaded {{ ds.uploadedAt }} by {{ ds.uploadedBy }}</p>
        </div>
        <div class="actions">
          <ng-container [ngSwitch]="ds.status">
            <ng-container *ngSwitchCase="'IN_REVIEW'">
              <button class="primary" *ngIf="svc.user().role === 'DATA_STEWARD'"
                      (click)="svc.submitForApproval()">Submit for approval</button>
              <span class="ro" *ngIf="svc.user().role !== 'DATA_STEWARD'">Read-only — corrections need the Data Steward role</span>
            </ng-container>
            <ng-container *ngSwitchCase="'PENDING_APPROVAL'">
              <ng-container *ngIf="svc.user().role === 'APPROVER'; else waiting">
                <button class="primary" (click)="svc.approve()">Approve &amp; publish to lake</button>
                <button class="danger" (click)="svc.reject()">Reject</button>
              </ng-container>
              <ng-template #waiting><span class="ro">Locked — awaiting second-person approval</span></ng-template>
            </ng-container>
            <ng-container *ngSwitchCase="'PUBLISHED'">
              <span class="published">✓ Published · Iceberg snapshot <code>{{ ds.snapshotId }}</code></span>
            </ng-container>
          </ng-container>
        </div>
      </div>

      <section class="diff" *ngIf="ds.status === 'PENDING_APPROVAL' && svc.pendingEdits(ds).length > 0">
        <h3>Corrections awaiting sign-off</h3>
        <div class="diff-row" *ngFor="let e of svc.pendingEdits(ds)">
          <span class="fld">{{ e.recordId }} · {{ e.field }}</span>
          <span class="vals"><s>{{ e.from }}</s><span class="arrow">→</span><b>{{ e.to }}</b></span>
        </div>
      </section>

      <app-grid></app-grid>

      <footer class="foot">
        Staging: <code>postgres://stage/{{ svc.user().tenant }}</code> · Target:
        <code>lake.alpha_bank.customer_master</code> (Iceberg on S3) · Edits are audited field-by-field; PII columns
        follow the metadata store's masking policy.
      </footer>
    </main>

    <app-audit></app-audit>
  </div>
  `,
  styles: [`
    .shell { display: grid; height: 100vh;
             grid-template-columns: 264px minmax(0, 1fr) 300px;
             grid-template-rows: 56px minmax(0, 1fr);
             grid-template-areas: "top top top" "rail work audit"; }
    .topbar { grid-area: top; background: var(--ink); color: #E9EDEA; display: flex; align-items: center;
              gap: 18px; padding: 0 18px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .mark { font-family: var(--font-display); font-weight: 700; font-size: 13px; background: var(--verdigris);
            color: #fff; border-radius: 6px; padding: 4px 7px; letter-spacing: .03em; }
    .name { font-family: var(--font-display); font-weight: 600; font-size: 16px; letter-spacing: .01em; }
    .name em { font-style: normal; color: #9FB8AF; font-weight: 500; }
    .tenant { font-family: var(--font-data); font-size: 11.5px; color: #9FB8AF; border: 1px solid #2C3B49;
              border-radius: 20px; padding: 4px 12px; }
    .idbox { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .idbox label { font-size: 11px; color: #8D9AA6; }
    .idbox select { background: #1B2836; color: #E9EDEA; border: 1px solid #2C3B49; border-radius: 6px;
                    padding: 6px 8px; font-size: 12px; }

    .rail { grid-area: rail; border-right: 1px solid var(--line); background: #FBFCFA; overflow-y: auto; padding: 16px 12px; }
    .rail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .rail h2 { font-family: var(--font-display); font-size: 13px; font-weight: 600; margin: 0; color: var(--ink); }
    .upload { border: 1px solid var(--verdigris); color: var(--verdigris); background: transparent;
              border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; }
    .upload:disabled { opacity: .4; cursor: not-allowed; }
    .upload:not(:disabled):hover { background: var(--verdigris-soft); }
    .rail ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
    .rail li > button { width: 100%; text-align: left; border: 1px solid var(--line); background: var(--cell);
                        border-radius: 8px; padding: 10px 11px; display: flex; flex-direction: column; gap: 3px; }
    .rail li.active > button { border-color: var(--ink); box-shadow: inset 3px 0 0 var(--ink); }
    .ds-name { font-family: var(--font-data); font-size: 12px; font-weight: 600; color: var(--ink-soft); word-break: break-all; }
    .ds-meta { font-size: 10.5px; color: var(--text-dim); }
    .status { align-self: flex-start; margin-top: 4px; font-family: var(--font-display); font-size: 9.5px;
              font-weight: 600; letter-spacing: .08em; text-transform: uppercase; padding: 2px 7px; border-radius: 3px; }
    .status[data-s="IN_REVIEW"] { background: var(--amber-soft); color: var(--amber); }
    .status[data-s="PENDING_APPROVAL"] { background: #E8EAF3; color: #3D4E9E; }
    .status[data-s="PUBLISHED"] { background: var(--verdigris-soft); color: var(--verdigris); }

    .work { grid-area: work; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
    .workflow { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; justify-content: space-between; }
    .ds-title h1 { font-family: var(--font-display); font-size: 20px; font-weight: 600; margin: 0; color: var(--ink); }
    .ds-title p { margin: 4px 0 0; font-size: 12px; color: var(--text-dim); }
    .actions { display: flex; gap: 8px; align-items: center; }
    .primary { background: var(--verdigris); color: #fff; border: none; border-radius: 7px; padding: 9px 16px;
               font-weight: 600; font-size: 13px; }
    .primary:hover { background: #0B6653; }
    .danger { background: transparent; color: var(--claret); border: 1px solid var(--claret); border-radius: 7px;
              padding: 8px 14px; font-weight: 600; font-size: 13px; }
    .danger:hover { background: var(--claret-soft); }
    .ro { font-size: 12px; color: var(--text-dim); border: 1px dashed var(--line-strong); border-radius: 6px; padding: 7px 12px; }
    .published { font-family: var(--font-data); font-size: 12px; color: var(--verdigris); }
    .published code { background: var(--verdigris-soft); border-radius: 4px; padding: 2px 6px; }

    .diff { border: 1px solid var(--line-strong); border-radius: 8px; background: #FBFCFA; padding: 12px 14px; }
    .diff h3 { font-family: var(--font-display); font-size: 12.5px; font-weight: 600; margin: 0 0 8px; color: var(--ink); }
    .diff-row { display: flex; flex-wrap: wrap; gap: 4px 14px; font-family: var(--font-data); font-size: 12px;
                padding: 4px 0; border-top: 1px dashed var(--line); }
    .diff-row .fld { color: var(--text-dim); min-width: 200px; }
    .diff-row s { color: var(--claret); text-decoration-color: var(--claret); }
    .arrow { margin: 0 6px; color: var(--text-dim); }
    .diff-row b { color: var(--verdigris); }

    .foot { font-size: 11px; color: var(--text-dim); }
    .foot code { font-family: var(--font-data); background: #EEF0EC; border-radius: 4px; padding: 1px 5px; }

    app-audit { grid-area: audit; min-height: 0; display: block; overflow: hidden; }

    @media (max-width: 980px) {
      .shell { grid-template-columns: 1fr; grid-template-rows: auto auto minmax(0,1fr) auto;
               grid-template-areas: "top" "rail" "work" "audit"; height: auto; min-height: 100vh; }
      .rail { border-right: none; border-bottom: 1px solid var(--line); }
      app-audit { border-top: 1px solid var(--line); max-height: 320px; }
    }
  `]
})
export class AppComponent {
  svc = inject(DataService);

  setRole(r: Role) { this.svc.setRole(r); }

  statusLabel(s: string) {
    return { IN_REVIEW: 'In review', PENDING_APPROVAL: 'Pending approval', PUBLISHED: 'Published', REJECTED: 'Rejected' }[s] ?? s;
  }
}
