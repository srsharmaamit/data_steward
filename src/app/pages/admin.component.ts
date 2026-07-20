import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Admin</h1>
        <p>Tenant user directory — roles map 1:1 to Keycloak realm roles carried in the JWT</p>
      </div>
    </div>

    <table class="list">
      <thead><tr><th>User</th><th>Role</th><th>PII access</th><th>Last seen</th><th>Status</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let u of svc.platformUsers()">
          <td><b>{{ u.name }}</b><br><span class="mono dim">{{ u.email }}</span></td>
          <td><span class="rolechip" [attr.data-r]="u.role">{{ u.role.replace('_',' ').toLowerCase() }}</span></td>
          <td class="dim">{{ u.role === 'ANALYST' ? 'masked' : 'granted · reveals audited' }}</td>
          <td class="mono dim">{{ u.lastSeen }}</td>
          <td>
            <span class="dot" [class.off]="!u.active"></span>
            {{ u.active ? 'Active' : 'Disabled' }}
          </td>
          <td>
            <button class="btn ghost slim" (click)="svc.toggleUserActive(u.email)">
              {{ u.active ? 'Disable' : 'Enable' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="card note">
      <h3>Tenant isolation</h3>
      <p>tenant-alpha-bank runs in its own Kubernetes namespace with a dedicated staging Postgres,
         its own Keycloak realm, and prefix-scoped object storage. Users here can never see another
         tenant's data — isolation is enforced below the application layer, not by row filters.</p>
    </div>
  </div>
  `,
  styles: [`
    .dim { color: var(--text-dim); font-size: 12px; }
    .rolechip { font-family: var(--font-display); font-size: 10px; font-weight: 600; letter-spacing: .06em;
                text-transform: uppercase; padding: 3px 8px; border-radius: 3px; }
    .rolechip[data-r="DATA_STEWARD"] { background: var(--amber-soft); color: var(--amber); }
    .rolechip[data-r="APPROVER"] { background: var(--verdigris-soft); color: var(--verdigris); }
    .rolechip[data-r="ANALYST"] { background: var(--surface); color: var(--text-dim); border: 1px solid var(--line-strong); }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--verdigris); margin-right: 6px; }
    .dot.off { background: var(--line-strong); }
    .slim { padding: 5px 12px; font-size: 12px; }
    .note { margin-top: 16px; }
    .note h3 { font-family: var(--font-display); font-size: 13px; margin: 0 0 8px; color: var(--ink-soft); }
    .note p { font-size: 12.5px; color: var(--text-dim); margin: 0; line-height: 1.55; }
  `]
})
export class AdminComponent {
  svc = inject(DataService);
}
