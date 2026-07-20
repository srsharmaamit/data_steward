import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { ApiService } from '../api.service';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
  <div class="space-y-6 animate-fade-in">
    <!-- Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-heading font-bold tracking-tight">
          Welcome back, {{ firstName() }}
        </h1>
        <p class="text-muted-foreground">Here's an overview of your data management activities</p>
      </div>
      <a routerLink="/upload" *ngIf="auth.hasRole(['admin', 'data_steward'])">
        <button class="ui-btn ui-btn-default ui-btn-md">
          <i-lucide name="upload" class="mr-2 h-4 w-4"></i-lucide>
          Upload Data
        </button>
      </a>
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <div class="ui-card" *ngFor="let stat of statCards()">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">{{ stat.title }}</p>
              <p class="text-3xl font-heading font-bold mt-1">{{ loading() ? '-' : stat.value }}</p>
            </div>
            <div class="p-3 rounded-full {{ stat.bgColor }}">
              <i-lucide [name]="stat.icon" class="h-6 w-6 {{ stat.color }}"></i-lucide>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <!-- Recent Activity -->
      <div class="ui-card lg:col-span-2">
        <div class="ui-card-header flex-row items-center justify-between pb-2" style="display:flex">
          <h3 class="ui-card-title text-lg font-heading flex items-center gap-2">
            <i-lucide name="activity" class="h-5 w-5"></i-lucide>
            Recent Activity
          </h3>
          <a routerLink="/audit-logs">
            <button class="ui-btn ui-btn-ghost ui-btn-sm">
              View All
              <i-lucide name="arrow-right" class="ml-1 h-4 w-4"></i-lucide>
            </button>
          </a>
        </div>
        <div class="ui-card-content">
          <div class="space-y-3" *ngIf="loading()">
            <div class="h-16 bg-muted animate-pulse rounded-md" *ngFor="let i of [1,2,3]"></div>
          </div>
          <div class="space-y-1" *ngIf="!loading() && recentActivity().length > 0">
            <div class="flex items-center justify-between py-3 border-b last:border-0"
                 *ngFor="let log of recentActivity()">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ actionLabel(log.action) }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ log.entity_type }}: {{ log.entity_id.slice(0, 8) }}...</p>
              </div>
              <div class="text-right ml-4">
                <p class="text-xs text-muted-foreground">{{ timeAgo(log.timestamp) }}</p>
                <p class="text-xs text-muted-foreground truncate max-w-[100px]">{{ log.user_email }}</p>
              </div>
            </div>
          </div>
          <div class="text-center py-8 text-muted-foreground" *ngIf="!loading() && recentActivity().length === 0">
            <i-lucide name="activity" class="h-10 w-10 mx-auto mb-2 opacity-50"></i-lucide>
            <p>No recent activity</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="ui-card">
        <div class="ui-card-header pb-2">
          <h3 class="ui-card-title text-lg font-heading">Quick Actions</h3>
        </div>
        <div class="ui-card-content space-y-3">
          <a routerLink="/upload" class="block" *ngIf="auth.hasRole(['admin', 'data_steward'])">
            <button class="ui-btn ui-btn-outline ui-btn-md w-full justify-start">
              <i-lucide name="upload" class="mr-2 h-4 w-4"></i-lucide>
              Upload New Dataset
            </button>
          </a>
          <a routerLink="/datasets" class="block">
            <button class="ui-btn ui-btn-outline ui-btn-md w-full justify-start">
              <i-lucide name="file-search" class="mr-2 h-4 w-4"></i-lucide>
              Review Datasets
            </button>
          </a>
          <a routerLink="/approvals" class="block" *ngIf="auth.hasRole(['admin', 'approver'])">
            <button class="ui-btn ui-btn-outline ui-btn-md w-full justify-start">
              <i-lucide name="check-circle" class="mr-2 h-4 w-4"></i-lucide>
              Pending Approvals
              <span *ngIf="(stats()?.pending_reviews ?? 0) > 0"
                    class="ml-auto bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full">
                {{ stats()?.pending_reviews }}
              </span>
            </button>
          </a>
        </div>
      </div>
    </div>

    <!-- No Tenant Warning -->
    <div class="ui-card border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800"
         *ngIf="!auth.user()?.tenant_id">
      <div class="p-4">
        <div class="flex items-start gap-3">
          <div class="text-amber-600 mt-0.5">
            <i-lucide name="clock" class="h-5 w-5"></i-lucide>
          </div>
          <div>
            <h3 class="font-medium text-amber-800 dark:text-amber-400">No Tenant Assigned</h3>
            <p class="text-sm text-amber-700 dark:text-amber-500 mt-1">
              You are not assigned to any tenant yet. Contact an administrator to get assigned to a tenant
              for full access to data management features.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class DashboardPage implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  stats = signal<any | null>(null);
  loading = signal(true);

  ngOnInit() { this.fetchStats(); }

  async fetchStats() {
    try {
      this.stats.set(await this.api.dashboardStats());
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      this.loading.set(false);
    }
  }

  firstName() { return this.auth.user()?.name?.split(' ')[0]; }

  recentActivity() { return (this.stats()?.recent_activity ?? []).slice(0, 8); }

  statCards() {
    const s = this.stats();
    return [
      { title: 'Total Datasets', value: s?.total_datasets || 0, icon: 'database', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
      { title: 'Pending Review', value: s?.pending_reviews || 0, icon: 'clock', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
      { title: 'Approved', value: s?.approved_datasets || 0, icon: 'check-circle', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
      { title: 'Published', value: s?.published_datasets || 0, icon: 'upload', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    ];
  }

  timeAgo(timestamp: string) {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  actionLabel(action: string) {
    const labels: Record<string, string> = {
      CREATE: 'Created', UPLOAD: 'Uploaded data', UPDATE_FIELD: 'Updated field',
      SUBMIT_APPROVAL: 'Submitted for approval', APPROVAL_APPROVE: 'Approved',
      APPROVAL_REJECT: 'Rejected', PUBLISH: 'Published', DELETE: 'Deleted', AI_ANALYSIS: 'AI Analysis',
    };
    return labels[action] || action;
  }
}
