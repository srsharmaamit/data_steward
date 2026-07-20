import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { ThemeService } from '../theme.service';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
  <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-heading font-bold tracking-tight">Settings</h1>
      <p class="text-muted-foreground">Manage your account and preferences</p>
    </div>

    <!-- Profile Section -->
    <div class="ui-card">
      <div class="ui-card-header">
        <h3 class="ui-card-title text-lg font-heading flex items-center gap-2">
          <i-lucide name="user" class="h-5 w-5"></i-lucide>
          Profile
        </h3>
        <p class="ui-card-desc">Your account information</p>
      </div>
      <div class="ui-card-content space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="ui-label text-muted-foreground text-sm">Name</label>
            <p class="font-medium">{{ auth.user()?.name }}</p>
          </div>
          <div>
            <label class="ui-label text-muted-foreground text-sm">Email</label>
            <p class="font-medium">{{ auth.user()?.email }}</p>
          </div>
        </div>
        <div class="ui-separator"></div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="ui-label text-muted-foreground text-sm">Role</label>
            <div class="flex items-center gap-2">
              <i-lucide name="shield" class="h-4 w-4 text-primary"></i-lucide>
              <p class="font-medium capitalize">{{ auth.user()?.role?.replace('_', ' ') }}</p>
            </div>
          </div>
          <div>
            <label class="ui-label text-muted-foreground text-sm">Tenant</label>
            <div class="flex items-center gap-2">
              <i-lucide name="building" class="h-4 w-4 text-primary"></i-lucide>
              <p class="font-medium">{{ tenantLabel() }}</p>
            </div>
          </div>
        </div>
        <div class="ui-separator"></div>
        <div>
          <label class="ui-label text-muted-foreground text-sm">Account Created</label>
          <p class="font-medium">{{ createdLabel() }}</p>
        </div>
      </div>
    </div>

    <!-- Appearance Section -->
    <div class="ui-card">
      <div class="ui-card-header">
        <h3 class="ui-card-title text-lg font-heading flex items-center gap-2">
          <i-lucide name="palette" class="h-5 w-5"></i-lucide>
          Appearance
        </h3>
        <p class="ui-card-desc">Customize how the application looks</p>
      </div>
      <div class="ui-card-content space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <label class="ui-label">Theme</label>
            <p class="text-sm text-muted-foreground">Choose between light and dark mode</p>
          </div>
          <select class="ui-select w-32" [ngModel]="theme.theme()" (ngModelChange)="theme.setTheme($event)">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Role Permissions Info -->
    <div class="ui-card">
      <div class="ui-card-header">
        <h3 class="ui-card-title text-lg font-heading flex items-center gap-2">
          <i-lucide name="shield" class="h-5 w-5"></i-lucide>
          Role Permissions
        </h3>
        <p class="ui-card-desc">What you can do based on your role</p>
      </div>
      <div class="ui-card-content">
        <div class="space-y-3">
          <div class="p-3 bg-primary/5 rounded-md" *ngIf="auth.user()?.role === 'admin'">
            <p class="font-medium text-sm">Admin</p>
            <p class="text-xs text-muted-foreground mt-1">
              Full access: Create tenants, manage users, upload/review/approve data, publish to data lake
            </p>
          </div>
          <div class="p-3 bg-primary/5 rounded-md" *ngIf="auth.user()?.role === 'data_steward'">
            <p class="font-medium text-sm">Data Steward</p>
            <p class="text-xs text-muted-foreground mt-1">
              Upload datasets, review and edit data records, submit for approval, view audit logs
            </p>
          </div>
          <div class="p-3 bg-primary/5 rounded-md" *ngIf="auth.user()?.role === 'approver'">
            <p class="font-medium text-sm">Approver</p>
            <p class="text-xs text-muted-foreground mt-1">
              Review datasets, approve or reject submissions, publish approved data to data lake
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class SettingsPage {
  auth = inject(AuthService);
  theme = inject(ThemeService);

  tenantLabel() {
    const t = this.auth.user()?.tenant_id;
    return t ? t.slice(0, 8) + '...' : 'Unassigned';
  }

  createdLabel() {
    const c = this.auth.user()?.created_at;
    return c ? new Date(c).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '-';
  }
}
