import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Approval } from '../api.service';
import { AuthService } from '../auth.service';
import { ToastService } from '../toast.service';
import { IconComponent } from '../icon.component';
import { StatusBadgeComponent } from '../status-badge.component';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent],
  template: `
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-heading font-bold tracking-tight">Approval Queue</h1>
        <p class="text-muted-foreground">Review and approve dataset submissions</p>
      </div>
      <select class="ui-select w-48" [ngModel]="statusFilter()" (ngModelChange)="setStatus($event)">
        <option value="all">All Approvals</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>

    <!-- Approvals List -->
    <div class="ui-card">
      <div class="p-0">
        <div class="flex items-center justify-center py-12" *ngIf="loading()">
          <i-lucide name="loader" class="h-8 w-8 text-muted-foreground"></i-lucide>
        </div>

        <div class="text-center py-12" *ngIf="!loading() && approvals().length === 0">
          <i-lucide name="clock" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i-lucide>
          <h3 class="font-heading font-semibold text-lg mb-1">No approvals found</h3>
          <p class="text-muted-foreground">
            {{ statusFilter() === 'pending' ? 'No datasets pending approval' : 'No approvals match your filter' }}
          </p>
        </div>

        <table class="ui-table" *ngIf="!loading() && approvals().length > 0">
          <thead>
            <tr class="ui-tr">
              <th class="ui-th">Dataset</th>
              <th class="ui-th">Status</th>
              <th class="ui-th">Submitted By</th>
              <th class="ui-th">Submitted</th>
              <th class="ui-th">Comments</th>
              <th class="ui-th w-[150px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr class="ui-tr" *ngFor="let approval of approvals()">
              <td class="ui-td">
                <button class="font-medium hover:underline text-left" (click)="viewDataset(approval.dataset_id)">
                  {{ approval.dataset_name }}
                </button>
              </td>
              <td class="ui-td"><status-badge [status]="approval.status"></status-badge></td>
              <td class="ui-td text-sm text-muted-foreground">{{ approval.submitted_by.slice(0, 8) }}...</td>
              <td class="ui-td text-sm text-muted-foreground">{{ formatDate(approval.submitted_at) }}</td>
              <td class="ui-td text-sm max-w-[200px] truncate">{{ approval.comments || '-' }}</td>
              <td class="ui-td">
                <div class="flex items-center gap-1">
                  <button class="ui-btn ui-btn-ghost ui-btn-icon" (click)="viewDataset(approval.dataset_id)">
                    <i-lucide name="eye" class="h-4 w-4"></i-lucide>
                  </button>
                  <ng-container *ngIf="canProcess() && approval.status === 'pending'">
                    <button class="ui-btn ui-btn-ghost ui-btn-icon text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            (click)="handleAction(approval, 'approve')">
                      <i-lucide name="check-circle" class="h-4 w-4"></i-lucide>
                    </button>
                    <button class="ui-btn ui-btn-ghost ui-btn-icon text-red-600 hover:text-red-700 hover:bg-red-50"
                            (click)="handleAction(approval, 'reject')">
                      <i-lucide name="x-circle" class="h-4 w-4"></i-lucide>
                    </button>
                  </ng-container>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Action Dialog -->
    <ng-container *ngIf="actionDialogOpen()">
      <div class="ui-overlay" (click)="actionDialogOpen.set(false)"></div>
      <div class="ui-dialog">
        <div class="flex flex-col space-y-1.5">
          <h2 class="ui-dialog-title">{{ actionType === 'approve' ? 'Approve Dataset' : 'Reject Dataset' }}</h2>
          <p class="ui-dialog-desc">
            {{ actionType === 'approve'
              ? 'Approving will allow the dataset to be published to the data lake.'
              : 'Rejecting will return the dataset to the submitter for further edits.' }}
          </p>
        </div>
        <div class="space-y-4 py-4">
          <div>
            <p class="text-sm font-medium mb-1">Dataset</p>
            <p class="text-sm text-muted-foreground">{{ selectedApproval?.dataset_name }}</p>
          </div>
          <div *ngIf="selectedApproval?.comments">
            <p class="text-sm font-medium mb-1">Submitter Comments</p>
            <p class="text-sm text-muted-foreground">{{ selectedApproval?.comments }}</p>
          </div>
          <div>
            <p class="text-sm font-medium mb-1">Your Comments</p>
            <textarea class="ui-textarea" rows="3"
                      [placeholder]="actionType === 'reject' ? 'Explain why this is being rejected...' : 'Add any comments (optional)'"
                      [(ngModel)]="actionComments"></textarea>
          </div>
        </div>
        <div class="ui-dialog-footer">
          <button class="ui-btn ui-btn-outline ui-btn-md" (click)="actionDialogOpen.set(false)">Cancel</button>
          <button class="ui-btn ui-btn-md"
                  [ngClass]="actionType === 'approve' ? 'ui-btn-default' : 'ui-btn-destructive'"
                  (click)="processAction()" [disabled]="processing()">
            <i-lucide *ngIf="processing()" name="loader" class="mr-2 h-4 w-4"></i-lucide>
            {{ actionType === 'approve' ? 'Approve' : 'Reject' }}
          </button>
        </div>
      </div>
    </ng-container>
  </div>
  `
})
export class ApprovalsPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  approvals = signal<Approval[]>([]);
  loading = signal(true);
  statusFilter = signal('pending');

  actionDialogOpen = signal(false);
  selectedApproval: Approval | null = null;
  actionType: 'approve' | 'reject' | null = null;
  actionComments = '';
  processing = signal(false);

  ngOnInit() { this.fetch(); }

  async fetch() {
    try {
      this.approvals.set(await this.api.listApprovals(this.statusFilter()));
    } catch {
      this.toast.error('Failed to fetch approvals');
    } finally {
      this.loading.set(false);
    }
  }

  setStatus(v: string) { this.statusFilter.set(v); this.fetch(); }

  canProcess() { return this.auth.hasRole(['admin', 'approver']); }

  viewDataset(id: string) { this.router.navigate(['/datasets', id]); }

  handleAction(approval: Approval, action: 'approve' | 'reject') {
    this.selectedApproval = approval;
    this.actionType = action;
    this.actionComments = '';
    this.actionDialogOpen.set(true);
  }

  async processAction() {
    if (!this.selectedApproval || !this.actionType) return;
    this.processing.set(true);
    try {
      await this.api.approvalAction(this.selectedApproval.id, this.actionType, this.actionComments);
      this.toast.success(`Dataset ${this.actionType === 'approve' ? 'approved' : 'rejected'}`);
      this.actionDialogOpen.set(false);
      this.fetch();
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Action failed');
    } finally {
      this.processing.set(false);
    }
  }

  formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
