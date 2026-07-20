import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../data.service';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Approvals</h1>
        <p>Datasets locked for second-person review. The submitting steward can never approve their own work.</p>
      </div>
    </div>

    <div class="card q" *ngFor="let d of pending()">
      <div class="row">
        <div>
          <span class="mono nm">{{ d.name }}</span>
          <span class="mono id">{{ d.id }} · {{ d.recordCount }} records · {{ edits(d) }} correction{{ edits(d) === 1 ? '' : 's' }}</span>
        </div>
        <div class="acts">
          <a class="btn ghost" [routerLink]="['/datasets', d.id]">Inspect</a>
          <ng-container *ngIf="svc.user().role === 'APPROVER'">
            <button class="btn primary" (click)="approve(d.id)">Approve &amp; publish</button>
            <button class="btn danger" (click)="reject(d.id)">Reject</button>
          </ng-container>
        </div>
      </div>
      <div class="diffs" *ngIf="svc.pendingEdits(d).length">
        <div class="diff-row mono" *ngFor="let e of svc.pendingEdits(d)">
          <span class="fld">{{ e.recordId }} · {{ e.field }}</span>
          <span><s>{{ e.from }}</s><span class="arrow">→</span><b>{{ e.to }}</b></span>
        </div>
      </div>
      <p class="note" *ngIf="svc.user().role === 'DATA_STEWARD'">Waiting for an Approver — sign in as M. Boyd to sign off.</p>
    </div>

    <div class="card empty" *ngIf="pending().length === 0">
      <p class="big">Queue's clear ✓</p>
      <p class="small">Nothing is waiting for sign-off. Submitted datasets will appear here.</p>
    </div>
  </div>
  `,
  styles: [`
    .q { margin-bottom: 12px; }
    .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
    .nm { font-weight: 600; font-size: 13px; display: block; }
    .id { font-size: 11px; color: var(--text-dim); }
    .acts { display: flex; gap: 8px; }
    .acts .btn { text-decoration: none; }
    .diffs { margin-top: 12px; border-top: 1px dashed var(--line); }
    .diff-row { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 12px; padding: 5px 0; border-bottom: 1px dashed var(--line); }
    .diff-row .fld { color: var(--text-dim); min-width: 200px; }
    .diff-row s { color: var(--claret); text-decoration-color: var(--claret); }
    .arrow { margin: 0 6px; color: var(--text-dim); }
    .diff-row b { color: var(--verdigris); }
    .note { margin: 10px 0 0; font-size: 11.5px; color: var(--text-dim); }
    .empty { text-align: center; padding: 44px 20px; }
    .big { font-size: 15px; font-weight: 600; color: var(--verdigris); margin: 0; }
    .small { font-size: 12px; color: var(--text-dim); margin: 8px 0 0; }
  `]
})
export class ApprovalsComponent {
  svc = inject(DataService);
  private router = inject(Router);

  pending = computed(() => this.svc.datasets().filter(d => d.status === 'PENDING_APPROVAL'));

  edits(d: any) { return this.svc.pendingEdits(d).length; }

  approve(id: string) { this.svc.select(id); this.svc.approve(); }
  reject(id: string) { this.svc.select(id); this.svc.reject(); }
}
