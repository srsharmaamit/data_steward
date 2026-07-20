import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { ThemeService } from './theme.service';
import { DataService } from './data.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="mark">DS</span>
        <span class="name">DataSteward <em>Hub</em></span>
      </div>
      <span class="tenant" title="Isolated Kubernetes namespace per tenant">◈ {{ auth.user()?.tenant }}</span>
      <div class="right">
        <button class="icon-btn" (click)="theme.toggle()" [title]="theme.theme() === 'light' ? 'Switch to dark' : 'Switch to light'">
          {{ theme.theme() === 'light' ? '☾' : '☀' }}
        </button>
        <div class="me">
          <span class="who">{{ auth.user()?.name }}</span>
          <span class="role">{{ roleLabel() }}</span>
        </div>
        <button class="icon-btn" (click)="logout()" title="Sign out">⎋</button>
      </div>
    </header>

    <nav class="sidebar">
      <a routerLink="/dashboard" routerLinkActive="on"><span class="g">▤</span> Dashboard</a>
      <a routerLink="/datasets" routerLinkActive="on"><span class="g">☰</span> Datasets</a>
      <a routerLink="/upload" routerLinkActive="on" *ngIf="auth.user()?.role === 'DATA_STEWARD'"><span class="g">⇪</span> Upload</a>
      <a routerLink="/approvals" routerLinkActive="on" *ngIf="auth.user()?.role !== 'ANALYST'">
        <span class="g">✓</span> Approvals
        <span class="count" *ngIf="svc.stats().pending as n">{{ n }}</span>
      </a>
      <a routerLink="/audit" routerLinkActive="on"><span class="g">≡</span> Audit logs</a>
      <div class="gap"></div>
      <a routerLink="/admin" routerLinkActive="on" *ngIf="auth.user()?.admin"><span class="g">⚙</span> Admin</a>
      <a routerLink="/settings" routerLinkActive="on"><span class="g">✎</span> Settings</a>
    </nav>

    <main class="content"><router-outlet /></main>
  </div>
  `,
  styles: [`
    .shell { display: grid; height: 100vh; grid-template-columns: 216px minmax(0,1fr);
             grid-template-rows: 56px minmax(0,1fr); grid-template-areas: "top top" "side main"; }
    .topbar { grid-area: top; background: var(--ink); color: #E9EDEA; display: flex; align-items: center; gap: 18px; padding: 0 18px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .mark { font-family: var(--font-display); font-weight: 700; font-size: 13px; background: var(--verdigris); color: #fff; border-radius: 6px; padding: 4px 7px; }
    .name { font-family: var(--font-display); font-weight: 600; font-size: 16px; }
    .name em { font-style: normal; color: #9FB8AF; font-weight: 500; }
    .tenant { font-family: var(--font-data); font-size: 11.5px; color: #9FB8AF; border: 1px solid #2C3B49; border-radius: 20px; padding: 4px 12px; }
    .right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
    .icon-btn { background: #1B2836; color: #E9EDEA; border: 1px solid #2C3B49; border-radius: 6px; width: 32px; height: 32px; font-size: 14px; }
    .icon-btn:hover { border-color: var(--verdigris); }
    .me { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.25; }
    .who { font-size: 12.5px; font-weight: 600; }
    .role { font-size: 10px; color: #8D9AA6; letter-spacing: .05em; text-transform: uppercase; font-family: var(--font-display); }

    .sidebar { grid-area: side; background: var(--ink); padding: 14px 10px; display: flex; flex-direction: column; gap: 2px; }
    .sidebar a { display: flex; align-items: center; gap: 10px; color: #B9C6CF; text-decoration: none; font-size: 13px;
                 padding: 9px 12px; border-radius: 7px; border-left: 3px solid transparent; }
    .sidebar a .g { width: 16px; text-align: center; color: #7D8C98; }
    .sidebar a:hover { background: #17222E; color: #E9EDEA; }
    .sidebar a.on { background: #17222E; color: #fff; border-left-color: var(--verdigris); }
    .sidebar a.on .g { color: var(--verdigris); }
    .count { margin-left: auto; background: var(--verdigris); color: #fff; border-radius: 10px; font-size: 10.5px;
             font-weight: 700; padding: 1px 7px; font-family: var(--font-data); }
    .gap { flex: 1; }

    .content { grid-area: main; overflow-y: auto; background: var(--surface); }

    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; grid-template-rows: 56px auto minmax(0,1fr);
               grid-template-areas: "top" "side" "main"; }
      .sidebar { flex-direction: row; flex-wrap: wrap; padding: 8px; }
      .sidebar a { border-left: none; border-bottom: 2px solid transparent; }
      .sidebar a.on { border-bottom-color: var(--verdigris); }
      .gap { display: none; }
      .tenant { display: none; }
    }
  `]
})
export class LayoutComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  svc = inject(DataService);
  private router = inject(Router);

  roleLabel() {
    const u = this.auth.user();
    if (!u) return '';
    const base = { DATA_STEWARD: 'Data Steward', APPROVER: 'Approver', ANALYST: 'Analyst' }[u.role];
    return u.admin ? base + ' · admin' : base;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
