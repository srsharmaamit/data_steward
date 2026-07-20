import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { ThemeService } from './theme.service';
import { IconComponent } from './icon.component';

interface NavItem { path: string; label: string; icon: string; roles: string[]; }

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'layout-dashboard', roles: ['admin', 'data_steward', 'approver'] },
  { path: '/upload', label: 'Upload Data', icon: 'upload', roles: ['admin', 'data_steward'] },
  { path: '/datasets', label: 'Data Review', icon: 'file-search', roles: ['admin', 'data_steward', 'approver'] },
  { path: '/approvals', label: 'Approvals', icon: 'check-circle', roles: ['admin', 'approver'] },
  { path: '/audit-logs', label: 'Audit Logs', icon: 'history', roles: ['admin', 'data_steward', 'approver'] },
  { path: '/admin', label: 'Admin', icon: 'users', roles: ['admin'] },
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, IconComponent],
  template: `
  <div class="min-h-screen bg-background">
    <!-- Mobile sidebar backdrop -->
    <div *ngIf="sidebarOpen()" class="fixed inset-0 bg-black/50 z-40 lg:hidden" (click)="sidebarOpen.set(false)"></div>

    <!-- Sidebar -->
    <aside class="fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0"
           [class.translate-x-0]="sidebarOpen()" [class.-translate-x-full]="!sidebarOpen()">
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="flex items-center gap-3 h-16 px-6 border-b">
          <i-lucide name="database" class="h-7 w-7 text-primary"></i-lucide>
          <span class="font-heading font-bold text-lg tracking-tight">DataSteward</span>
        </div>

        <!-- Tenant Badge -->
        <div class="px-4 py-3 border-b" *ngIf="auth.user()?.tenant_id">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <i-lucide name="building" class="h-4 w-4"></i-lucide>
            <span class="truncate">Tenant Active</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <a *ngFor="let item of filteredNavItems()" [routerLink]="item.path" (click)="sidebarOpen.set(false)"
             class="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
             [ngClass]="isActive(item.path)
               ? 'bg-primary text-primary-foreground'
               : 'text-muted-foreground hover:bg-muted hover:text-foreground'">
            <i-lucide [name]="item.icon" class="h-4 w-4"></i-lucide>
            {{ item.label }}
          </a>
        </nav>

        <!-- User section -->
        <div class="p-4 border-t">
          <div class="flex items-center gap-3">
            <span class="ui-avatar h-9 w-9">
              <span class="ui-avatar-fallback bg-primary text-primary-foreground text-sm">{{ initials() }}</span>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ auth.user()?.name }}</p>
              <p class="text-xs text-muted-foreground capitalize">{{ auth.user()?.role?.replace('_', ' ') }}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Header -->
      <header class="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur border-b">
        <div class="flex items-center justify-between h-full px-4 lg:px-6">
          <!-- Mobile menu button -->
          <button (click)="sidebarOpen.set(!sidebarOpen())"
                  class="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <i-lucide [name]="sidebarOpen() ? 'x' : 'menu'" class="h-5 w-5"></i-lucide>
          </button>

          <!-- Page title -->
          <h1 class="text-lg font-heading font-semibold hidden lg:block">{{ pageTitle() }}</h1>

          <!-- Right side actions -->
          <div class="flex items-center gap-2">
            <!-- Theme toggle dropdown -->
            <div class="relative" (click)="$event.stopPropagation()">
              <button class="ui-btn ui-btn-ghost ui-btn-icon" (click)="toggleMenu('theme')">
                <i-lucide [name]="theme.theme() === 'light' ? 'sun' : 'moon'" class="h-5 w-5"></i-lucide>
              </button>
              <div class="ui-menu right-0 mt-2 w-48" *ngIf="openMenu() === 'theme'">
                <div class="ui-menu-label">Theme</div>
                <div class="ui-menu-sep"></div>
                <button class="ui-menu-item" (click)="theme.toggleTheme(); openMenu.set(null)">
                  <i-lucide name="sun" class="h-4 w-4 mr-2"></i-lucide>
                  {{ theme.theme() === 'light' ? 'Switch to Dark' : 'Switch to Light' }}
                </button>
              </div>
            </div>

            <!-- User dropdown -->
            <div class="relative" (click)="$event.stopPropagation()">
              <button class="ui-btn ui-btn-ghost ui-btn-icon" (click)="toggleMenu('user')">
                <span class="ui-avatar h-8 w-8">
                  <span class="ui-avatar-fallback bg-primary text-primary-foreground text-xs">{{ initials() }}</span>
                </span>
              </button>
              <div class="ui-menu right-0 mt-2 w-56" *ngIf="openMenu() === 'user'">
                <div class="ui-menu-label">
                  <p class="font-medium">{{ auth.user()?.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ auth.user()?.email }}</p>
                </div>
                <div class="ui-menu-sep"></div>
                <button class="ui-menu-item" (click)="go('/settings')">
                  <i-lucide name="settings" class="h-4 w-4 mr-2"></i-lucide> Settings
                </button>
                <div class="ui-menu-sep"></div>
                <button class="ui-menu-item text-destructive" (click)="logout()">
                  <i-lucide name="log-out" class="h-4 w-4 mr-2"></i-lucide> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="p-4 lg:p-6"><router-outlet /></main>
    </div>
  </div>
  `
})
export class LayoutComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  private router = inject(Router);

  sidebarOpen = signal(false);
  openMenu = signal<'theme' | 'user' | null>(null);

  @HostListener('document:click') closeMenus() { this.openMenu.set(null); }

  toggleMenu(which: 'theme' | 'user') {
    this.openMenu.update(m => m === which ? null : which);
  }

  filteredNavItems() {
    return NAV_ITEMS.filter(i => this.auth.hasRole(i.roles));
  }

  isActive(path: string) {
    const url = this.router.url;
    return url === path || (path !== '/dashboard' && url.startsWith(path));
  }

  pageTitle() {
    return this.filteredNavItems().find(i => this.isActive(i.path))?.label || 'Dashboard';
  }

  initials() {
    const name = this.auth.user()?.name;
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  go(path: string) { this.openMenu.set(null); this.router.navigate([path]); }

  logout() {
    this.openMenu.set(null);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
