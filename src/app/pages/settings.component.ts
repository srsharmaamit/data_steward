import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page narrow">
    <div class="page-head"><div><h1>Settings</h1></div></div>

    <section class="card">
      <h3>Appearance</h3>
      <div class="row">
        <div>
          <b>Theme</b>
          <p class="dim">The ledger works late shifts too.</p>
        </div>
        <div class="seg">
          <button [class.on]="theme.theme() === 'light'" (click)="theme.set('light')">☀ Light</button>
          <button [class.on]="theme.theme() === 'dark'" (click)="theme.set('dark')">☾ Dark</button>
        </div>
      </div>
    </section>

    <section class="card">
      <h3>Profile</h3>
      <div class="kv"><span>Name</span><b>{{ auth.user()?.name }}</b></div>
      <div class="kv"><span>Email</span><b class="mono">{{ auth.user()?.email }}</b></div>
      <div class="kv"><span>Role</span><b>{{ auth.user()?.role?.replace('_',' ') | lowercase }}</b></div>
      <div class="kv"><span>Tenant</span><b class="mono">{{ auth.user()?.tenant }}</b></div>
      <div class="kv"><span>PII access</span><b>{{ auth.user()?.piiAccess ? 'granted — reveals are audited' : 'masked' }}</b></div>
    </section>

    <section class="card">
      <h3>Backend</h3>
      <p class="dim">This deployment runs on an in-browser demo data layer. To wire the Spring Boot API,
         set <code>API_URL</code> in <code>src/app/data.service.ts</code> to your tenant's ingress and set
         <code>UI_ORIGIN</code> on the backend for CORS. The REST contract already matches
         <code>src/app/models.ts</code>.</p>
    </section>
  </div>
  `,
  styles: [`
    .narrow { max-width: 660px; }
    section { margin-bottom: 14px; }
    h3 { font-family: var(--font-display); font-size: 13.5px; margin: 0 0 12px; color: var(--ink-soft); }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
    .dim { color: var(--text-dim); font-size: 12px; margin: 3px 0 0; }
    .seg { display: flex; border: 1px solid var(--line-strong); border-radius: 8px; overflow: hidden; }
    .seg button { border: none; background: var(--cell); color: var(--text-dim); padding: 8px 16px; font-size: 12.5px; font-weight: 600; }
    .seg button.on { background: var(--verdigris); color: #fff; }
    .kv { display: flex; justify-content: space-between; gap: 14px; padding: 8px 0; border-bottom: 1px dashed var(--line); font-size: 13px; }
    .kv:last-child { border-bottom: none; }
    .kv span { color: var(--text-dim); }
    code { font-family: var(--font-data); font-size: 11.5px; background: var(--surface); border: 1px solid var(--line); border-radius: 4px; padding: 1px 5px; }
    p.dim { line-height: 1.6; }
  `]
})
export class SettingsComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
}
