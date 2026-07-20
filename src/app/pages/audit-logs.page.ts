import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, AuditLog } from '../api.service';
import { ToastService } from '../toast.service';
import { IconComponent } from '../icon.component';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  UPLOAD: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  UPDATE_FIELD: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  DELETE: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  SUBMIT_APPROVAL: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  APPROVAL_APPROVE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  APPROVAL_REJECT: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  PUBLISH: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  AI_ANALYSIS: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
  AI_ANALYSIS_MOCK: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
};

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-heading font-bold tracking-tight">Audit Logs</h1>
      <p class="text-muted-foreground">Complete history of all actions and changes</p>
    </div>

    <!-- Filters -->
    <div class="ui-card">
      <div class="p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="relative flex-1">
            <i-lucide name="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"></i-lucide>
            <input class="ui-input pl-9" placeholder="Search by user, entity ID, or action..." [(ngModel)]="searchQuery">
          </div>
          <select class="ui-select w-full md:w-40" [ngModel]="entityTypeFilter()" (ngModelChange)="setEntity($event)">
            <option value="all">All Entities</option>
            <option value="dataset">Dataset</option>
            <option value="data_record">Data Record</option>
            <option value="approval">Approval</option>
            <option value="tenant">Tenant</option>
            <option value="user">User</option>
          </select>
          <select class="ui-select w-full md:w-40" [ngModel]="actionFilter()" (ngModelChange)="setAction($event)">
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPLOAD">Upload</option>
            <option value="UPDATE_FIELD">Update Field</option>
            <option value="DELETE">Delete</option>
            <option value="SUBMIT_APPROVAL">Submit Approval</option>
            <option value="APPROVAL_APPROVE">Approve</option>
            <option value="APPROVAL_REJECT">Reject</option>
            <option value="PUBLISH">Publish</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="ui-card">
      <div class="p-0">
        <div class="flex items-center justify-center py-12" *ngIf="loading()">
          <i-lucide name="loader" class="h-8 w-8 text-muted-foreground"></i-lucide>
        </div>

        <div class="text-center py-12" *ngIf="!loading() && filtered().length === 0">
          <i-lucide name="history" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i-lucide>
          <h3 class="font-heading font-semibold text-lg mb-1">No logs found</h3>
          <p class="text-muted-foreground">
            {{ searchQuery || entityTypeFilter() !== 'all' || actionFilter() !== 'all'
              ? 'Try adjusting your filters' : 'No activity has been recorded yet' }}
          </p>
        </div>

        <ng-container *ngIf="!loading() && filtered().length > 0">
          <table class="ui-table">
            <thead>
              <tr class="ui-tr">
                <th class="ui-th">Timestamp</th>
                <th class="ui-th">Action</th>
                <th class="ui-th">Entity</th>
                <th class="ui-th">User</th>
                <th class="ui-th">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr class="ui-tr" *ngFor="let log of filtered()">
                <td class="ui-td font-mono text-xs whitespace-nowrap">{{ formatDate(log.timestamp) }}</td>
                <td class="ui-td">
                  <span class="inline-flex px-2 py-1 rounded text-xs font-medium {{ actionColor(log.action) }}">
                    {{ formatAction(log.action) }}
                  </span>
                </td>
                <td class="ui-td">
                  <div>
                    <span class="capitalize text-sm">{{ log.entity_type }}</span>
                    <p class="font-mono text-xs text-muted-foreground">{{ log.entity_id.slice(0, 12) }}...</p>
                  </div>
                </td>
                <td class="ui-td text-sm text-muted-foreground">{{ log.user_email }}</td>
                <td class="ui-td max-w-[300px]">
                  <pre class="text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-hidden"
                       *ngIf="log.details; else noDetails">{{ detailsPreview(log.details) }}</pre>
                  <ng-template #noDetails><span class="text-muted-foreground">-</span></ng-template>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="flex items-center justify-between p-4 border-t">
            <p class="text-sm text-muted-foreground">Showing {{ filtered().length }} logs</p>
            <div class="flex items-center gap-2">
              <button class="ui-btn ui-btn-outline ui-btn-sm" (click)="setPage(page() - 1)" [disabled]="page() === 1">
                <i-lucide name="chevron-left" class="h-4 w-4"></i-lucide>
              </button>
              <span class="text-sm">Page {{ page() }}</span>
              <button class="ui-btn ui-btn-outline ui-btn-sm" (click)="setPage(page() + 1)" [disabled]="filtered().length < 50">
                <i-lucide name="chevron-right" class="h-4 w-4"></i-lucide>
              </button>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  </div>
  `
})
export class AuditLogsPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  page = signal(1);
  searchQuery = '';
  entityTypeFilter = signal('all');
  actionFilter = signal('all');

  ngOnInit() { this.fetch(); }

  async fetch() {
    this.loading.set(true);
    try {
      this.logs.set(await this.api.auditLogs(this.page(), 50,
        this.entityTypeFilter(), this.actionFilter()));
    } catch {
      this.toast.error('Failed to fetch audit logs');
    } finally {
      this.loading.set(false);
    }
  }

  setPage(p: number) { this.page.set(Math.max(1, p)); this.fetch(); }
  setEntity(v: string) { this.entityTypeFilter.set(v); this.fetch(); }
  setAction(v: string) { this.actionFilter.set(v); this.fetch(); }

  filtered() {
    const q = this.searchQuery.toLowerCase();
    return this.logs().filter(log =>
      log.user_email.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q));
  }

  actionColor(action: string) { return ACTION_COLORS[action] || 'text-gray-600 bg-gray-50'; }
  formatAction(action: string) { return action.replace(/_/g, ' '); }

  detailsPreview(details: any) {
    const s = JSON.stringify(details);
    return s.slice(0, 100) + (s.length > 100 ? '...' : '');
  }

  formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
}
