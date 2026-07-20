import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role, UserContext } from './models';

export interface DemoAccount {
  email: string;
  name: string;
  role: Role;
  admin: boolean;
  title: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'a.sharma@alpha.bank',  name: 'A. Sharma',  role: 'DATA_STEWARD', admin: true,  title: 'Data Steward · platform admin' },
  { email: 'm.boyd@alpha.bank',    name: 'M. Boyd',    role: 'APPROVER',     admin: false, title: 'Approver · second-person sign-off' },
  { email: 'r.chen@alpha.bank',    name: 'R. Chen',    role: 'ANALYST',      admin: false, title: 'Analyst · read-only, no PII' }
];

const STORE_KEY = 'dsh.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<(UserContext & { email: string; admin: boolean }) | null>(this.restore());

  private restore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  /** Demo login: any listed account + password "demo123". */
  login(email: string, password: string): string | null {
    const acc = DEMO_ACCOUNTS.find(a => a.email === email.trim().toLowerCase());
    if (!acc) return 'No account with that email. Use one of the demo accounts below.';
    if (password !== 'demo123') return 'Wrong password. All demo accounts use demo123.';
    const u = {
      name: acc.name, role: acc.role, tenant: 'tenant-alpha-bank',
      piiAccess: acc.role !== 'ANALYST', email: acc.email, admin: acc.admin
    };
    this.user.set(u);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(u)); } catch {}
    return null;
  }

  logout() {
    this.user.set(null);
    try { localStorage.removeItem(STORE_KEY); } catch {}
  }
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user() ? true : router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user()?.admin ? true : router.createUrlTree(['/dashboard']);
};
