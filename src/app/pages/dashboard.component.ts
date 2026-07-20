import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Morning, {{ firstName() }}</h1>
        <p>{{ svc.stats().records }} records staged across {{ svc.datasets().length }} datasets in {{ auth.user()?.tenant }}</p>
      </div>
      <a class="btn primary" routerLink="/upload" *ngIf="auth.user()?.role === 'DATA_STEWARD'">⇪ Upload dataset</a>
    </div>

    <div class="tiles">
      <a class="tile card" routerLink="/datasets" [queryParams]="{ status: 'IN_REVIEW' }">
        <span class="n amber">{{ svc.stats().inReview }}</span>
        <span class="l">In review</span>
        <span class="d">awaiting steward corrections</span>
      </a>
      <a class="tile card" routerLink="/approvals">
        <span class="n indigo">{{ svc.stats().pending }}</span>
        <span class="l">Pending approval</span>
        <span class="d">locked for second-person sign-off</span>
      </a>
      <a class="tile card" routerLink="/datasets" [queryParams]="{ status: 'PUBLISHED' }">
        <span class="n green">{{ svc.stats().published }}</span>
        <span class="l">Published</span>
        <span class="d">committed as Iceberg snapshots</span>
      </a>
      <a class="tile card" routerLink="/datasets">
        <span class="n claret">{{ svc.stats().flagged }}</span>
        <span class="l">Flagged records</span>
        <span class="d">raised by validation rules</span>
      </a>
    </div>

    <div class="cols">
      <section class="card chart">
        <h3>Uploads this week</h3>
        <div class="bars">
          <div class="bar" *ngFor="let d of svc.uploadTrend()">
            <span class="v" [style.height.%]="(d.count / max()) * 100" [title]="d.count + ' uploads'"></span>
            <span class="day">{{ d.day }}</span>
          </div>
        </div>
        <p class="foot">Multipart ingest via pre-signed URLs · SFTP, REST and UI sources</p>
      </section>

      <section class="card feed">
        <h3>Recent activity</h3>
        <ol>
          <li *ngFor="let e of recent()">
            <span class="act" [attr.data-a]="e.action">{{ e.action.replace('_',' ').toLowerCase() }}</span>
            <span class="txt">
              <b>{{ e.actor }}</b>
              <ng-container *ngIf="e.field"> corrected <code>{{ e.field }}</code> on {{ e.recordId }}</ng-container>
              <ng-container *ngIf="!e.field"> · {{ e.datasetId }}</ng-container>
            </span>
            <time>{{ e.at.slice(5, 16) }}</time>
          </li>
        </ol>
        <a routerLink="/audit" class="more">Open the full audit ledger →</a>
      </section>
    </div>
  </div>
  `,
  styles: [`
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .tile { display: flex; flex-direction: column; gap: 2px; text-decoration: none; color: var(--text); transition: border-color .12s; }
    .tile:hover { border-color: var(--verdigris); }
    .n { font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.1; }
    .n.amber { color: var(--amber); } .n.green { color: var(--verdigris); } .n.claret { color: var(--claret); }
    .n.indigo { color: #3D4E9E; } [data-theme="dark"] .n.indigo { color: #93A5E8; }
    .l { font-family: var(--font-display); font-size: 12.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
    .d { font-size: 11.5px; color: var(--text-dim); }

    .cols { display: grid; grid-template-columns: 1.1fr 1fr; gap: 12px; }
    h3 { font-family: var(--font-display); font-size: 14px; font-weight: 600; margin: 0 0 14px; color: var(--ink-soft); }

    .bars { display: flex; align-items: flex-end; gap: 10px; height: 150px; }
    .bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
    .v { width: 100%; max-width: 42px; background: var(--verdigris); border-radius: 5px 5px 0 0; min-height: 4px; opacity: .85; }
    .bar:hover .v { opacity: 1; }
    .day { font-family: var(--font-data); font-size: 10.5px; color: var(--text-dim); }
    .foot { font-size: 11px; color: var(--text-dim); margin: 12px 0 0; }

    .feed ol { list-style: none; margin: 0; padding: 0; }
    .feed li { display: flex; align-items: baseline; gap: 8px; padding: 8px 0; border-bottom: 1px dashed var(--line); font-size: 12.5px; }
    .feed li:last-child { border-bottom: none; }
    .act { font-family: var(--font-display); font-size: 9.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
           padding: 2px 6px; border-radius: 3px; background: var(--surface); color: var(--text-dim); white-space: nowrap; }
    .act[data-a="APPROVE"], .act[data-a="PUBLISH"] { background: var(--verdigris-soft); color: var(--verdigris); }
    .act[data-a="REJECT"], .act[data-a="PII_REVEAL"] { background: var(--claret-soft); color: var(--claret); }
    .act[data-a="EDIT"], .act[data-a="SUBMIT"], .act[data-a="UPLOAD"] { background: var(--amber-soft); color: var(--amber); }
    .txt { flex: 1; min-width: 0; }
    .txt code { font-family: var(--font-data); font-size: 11.5px; background: var(--surface); border-radius: 3px; padding: 0 4px; }
    time { font-family: var(--font-data); font-size: 10.5px; color: var(--text-dim); white-space: nowrap; }
    .more { display: inline-block; margin-top: 12px; font-size: 12px; color: var(--verdigris); text-decoration: none; font-weight: 600; }

    @media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent {
  svc = inject(DataService);
  auth = inject(AuthService);

  firstName = computed(() => (this.auth.user()?.name ?? '').split(' ').pop());
  recent = computed(() => this.svc.audit().slice(0, 7));
  max = computed(() => Math.max(...this.svc.uploadTrend().map(d => d.count), 1));
}
