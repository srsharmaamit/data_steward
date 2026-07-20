import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ApiUser, Tenant } from '../api.service';
import { AuthService } from '../auth.service';
import { ToastService } from '../toast.service';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
  <!-- Access denied -->
  <div class="text-center py-12" *ngIf="auth.user()?.role !== 'admin'; else adminView">
    <i-lucide name="settings" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i-lucide>
    <h2 class="text-xl font-heading font-semibold mb-2">Access Denied</h2>
    <p class="text-muted-foreground">You need admin privileges to access this page.</p>
  </div>

  <ng-template #adminView>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-heading font-bold tracking-tight">Administration</h1>
      <p class="text-muted-foreground">Manage tenants and user assignments</p>
    </div>

    <div class="space-y-4">
      <div class="ui-tabs-list">
        <button class="ui-tabs-trigger" [ngClass]="{'ui-tabs-trigger-active': tab() === 'tenants'}"
                (click)="tab.set('tenants')">
          <i-lucide name="building" class="h-4 w-4 mr-2"></i-lucide>
          Tenants
        </button>
        <button class="ui-tabs-trigger" [ngClass]="{'ui-tabs-trigger-active': tab() === 'users'}"
                (click)="tab.set('users')">
          <i-lucide name="users" class="h-4 w-4 mr-2"></i-lucide>
          Users
        </button>
      </div>

      <!-- Tenants Tab -->
      <div class="ui-card" *ngIf="tab() === 'tenants'">
        <div class="ui-card-header flex-row items-center justify-between" style="display:flex">
          <div>
            <h3 class="ui-card-title text-lg font-heading">Tenants</h3>
            <p class="ui-card-desc">Manage organization tenants</p>
          </div>
          <button class="ui-btn ui-btn-default ui-btn-md" (click)="createTenantOpen.set(true)">
            <i-lucide name="plus" class="h-4 w-4 mr-2"></i-lucide>
            Create Tenant
          </button>
        </div>
        <div class="ui-card-content">
          <div class="flex items-center justify-center py-8" *ngIf="loading()">
            <i-lucide name="loader" class="h-8 w-8 text-muted-foreground"></i-lucide>
          </div>
          <div class="text-center py-8 text-muted-foreground" *ngIf="!loading() && tenants().length === 0">
            <i-lucide name="building" class="h-10 w-10 mx-auto mb-2 opacity-50"></i-lucide>
            <p>No tenants created yet</p>
          </div>
          <table class="ui-table" *ngIf="!loading() && tenants().length > 0">
            <thead>
              <tr class="ui-tr">
                <th class="ui-th">Name</th>
                <th class="ui-th">Description</th>
                <th class="ui-th">Created</th>
                <th class="ui-th">ID</th>
              </tr>
            </thead>
            <tbody>
              <tr class="ui-tr" *ngFor="let tenant of tenants()">
                <td class="ui-td font-medium">{{ tenant.name }}</td>
                <td class="ui-td text-muted-foreground">{{ tenant.description || '-' }}</td>
                <td class="ui-td text-muted-foreground">{{ formatDate(tenant.created_at) }}</td>
                <td class="ui-td font-mono text-xs text-muted-foreground">{{ tenant.id.slice(0, 8) }}...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Users Tab -->
      <div class="ui-card" *ngIf="tab() === 'users'">
        <div class="ui-card-header">
          <h3 class="ui-card-title text-lg font-heading">Users</h3>
          <p class="ui-card-desc">Manage user tenant assignments</p>
        </div>
        <div class="ui-card-content">
          <div class="flex items-center justify-center py-8" *ngIf="loading()">
            <i-lucide name="loader" class="h-8 w-8 text-muted-foreground"></i-lucide>
          </div>
          <div class="text-center py-8 text-muted-foreground" *ngIf="!loading() && users().length === 0">
            <i-lucide name="users" class="h-10 w-10 mx-auto mb-2 opacity-50"></i-lucide>
            <p>No users found</p>
          </div>
          <table class="ui-table" *ngIf="!loading() && users().length > 0">
            <thead>
              <tr class="ui-tr">
                <th class="ui-th">Name</th>
                <th class="ui-th">Email</th>
                <th class="ui-th">Role</th>
                <th class="ui-th">Tenant</th>
                <th class="ui-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="ui-tr" *ngFor="let u of users()">
                <td class="ui-td font-medium">{{ u.name }}</td>
                <td class="ui-td text-muted-foreground">{{ u.email }}</td>
                <td class="ui-td"><span class="capitalize text-sm">{{ u.role.replace('_', ' ') }}</span></td>
                <td class="ui-td">
                  <span class="text-sm" *ngIf="u.tenant_id; else unassigned">{{ tenantName(u.tenant_id) }}</span>
                  <ng-template #unassigned><span class="text-sm text-amber-600">Unassigned</span></ng-template>
                </td>
                <td class="ui-td">
                  <button class="ui-btn ui-btn-ghost ui-btn-sm" (click)="openAssign(u)">
                    <i-lucide name="user-plus" class="h-4 w-4 mr-1"></i-lucide>
                    Assign
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Tenant Dialog -->
    <ng-container *ngIf="createTenantOpen()">
      <div class="ui-overlay" (click)="createTenantOpen.set(false)"></div>
      <div class="ui-dialog">
        <div class="flex flex-col space-y-1.5">
          <h2 class="ui-dialog-title">Create Tenant</h2>
          <p class="ui-dialog-desc">Create a new tenant organization for data isolation</p>
        </div>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="ui-label" for="tenant-name">Tenant Name</label>
            <input class="ui-input" id="tenant-name" placeholder="e.g., Acme Corporation" [(ngModel)]="tenantName_">
          </div>
          <div class="space-y-2">
            <label class="ui-label" for="tenant-desc">Description (Optional)</label>
            <textarea class="ui-textarea" id="tenant-desc" rows="2"
                      placeholder="Brief description of the tenant..." [(ngModel)]="tenantDescription"></textarea>
          </div>
        </div>
        <div class="ui-dialog-footer">
          <button class="ui-btn ui-btn-outline ui-btn-md" (click)="createTenantOpen.set(false)">Cancel</button>
          <button class="ui-btn ui-btn-default ui-btn-md" (click)="handleCreateTenant()"
                  [disabled]="!tenantName_.trim() || creating()">
            <i-lucide *ngIf="creating()" name="loader" class="mr-2 h-4 w-4"></i-lucide>
            Create
          </button>
        </div>
      </div>
    </ng-container>

    <!-- Assign User Dialog -->
    <ng-container *ngIf="assignUserOpen()">
      <div class="ui-overlay" (click)="assignUserOpen.set(false)"></div>
      <div class="ui-dialog">
        <div class="flex flex-col space-y-1.5">
          <h2 class="ui-dialog-title">Assign User to Tenant</h2>
          <p class="ui-dialog-desc">Assign {{ selectedUser?.name }} to a tenant organization</p>
        </div>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="ui-label">Select Tenant</label>
            <select class="ui-select" [(ngModel)]="selectedTenant">
              <option value="" disabled>Choose a tenant</option>
              <option *ngFor="let tenant of tenants()" [value]="tenant.id">{{ tenant.name }}</option>
            </select>
          </div>
        </div>
        <div class="ui-dialog-footer">
          <button class="ui-btn ui-btn-outline ui-btn-md" (click)="assignUserOpen.set(false)">Cancel</button>
          <button class="ui-btn ui-btn-default ui-btn-md" (click)="handleAssignUser()"
                  [disabled]="!selectedTenant || assigning()">
            <i-lucide *ngIf="assigning()" name="loader" class="mr-2 h-4 w-4"></i-lucide>
            Assign
          </button>
        </div>
      </div>
    </ng-container>
  </div>
  </ng-template>
  `
})
export class AdminPage implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  tab = signal<'tenants' | 'users'>('tenants');
  tenants = signal<Tenant[]>([]);
  users = signal<ApiUser[]>([]);
  loading = signal(true);

  createTenantOpen = signal(false);
  tenantName_ = '';
  tenantDescription = '';
  creating = signal(false);

  assignUserOpen = signal(false);
  selectedUser: ApiUser | null = null;
  selectedTenant = '';
  assigning = signal(false);

  ngOnInit() { this.fetchData(); }

  async fetchData() {
    try {
      const [tenants, users] = await Promise.all([this.api.listTenants(), this.api.listUsers()]);
      this.tenants.set(tenants);
      this.users.set(users);
    } catch {
      this.toast.error('Failed to load data');
    } finally {
      this.loading.set(false);
    }
  }

  tenantName(tenantId: string) {
    return this.tenants().find(t => t.id === tenantId)?.name || 'Unassigned';
  }

  async handleCreateTenant() {
    this.creating.set(true);
    try {
      await this.api.createTenant(this.tenantName_, this.tenantDescription);
      this.toast.success('Tenant created successfully');
      this.createTenantOpen.set(false);
      this.tenantName_ = '';
      this.tenantDescription = '';
      this.fetchData();
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Failed to create tenant');
    } finally {
      this.creating.set(false);
    }
  }

  openAssign(u: ApiUser) {
    this.selectedUser = u;
    this.selectedTenant = u.tenant_id || '';
    this.assignUserOpen.set(true);
  }

  async handleAssignUser() {
    if (!this.selectedUser || !this.selectedTenant) return;
    this.assigning.set(true);
    try {
      const updated = await this.api.assignUserTenant(this.selectedUser.id, this.selectedTenant);
      if (updated.id === this.auth.user()?.id) this.auth.refreshUser(updated);
      this.toast.success('User assigned to tenant');
      this.assignUserOpen.set(false);
      this.selectedUser = null;
      this.selectedTenant = '';
      this.fetchData();
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Failed to assign user');
    } finally {
      this.assigning.set(false);
    }
  }

  formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
