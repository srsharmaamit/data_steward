import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { ApiService, ApiUser } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  readonly user = signal<ApiUser | null>(null);
  readonly loading = signal<boolean>(true);

  constructor() { this.init(); }

  private async init() {
    const token = localStorage.getItem('token');
    if (!token) { this.loading.set(false); return; }
    try {
      const u = await this.api.fetchMe(token);
      this.user.set(u);
    } catch {
      this.logout();
    } finally {
      this.loading.set(false);
    }
  }

  async login(email: string, password: string) {
    const { access_token, user } = await this.api.login(email, password);
    localStorage.setItem('token', access_token);
    this.user.set(user);
    return user;
  }

  async register(email: string, password: string, name: string, role: ApiUser['role']) {
    const { access_token, user } = await this.api.register(email, password, name, role);
    localStorage.setItem('token', access_token);
    this.user.set(user);
    return user;
  }

  logout() {
    localStorage.removeItem('token');
    this.user.set(null);
    this.api.setCurrentUser(null);
  }

  refreshUser(u: ApiUser) { this.user.set({ ...u }); }

  hasRole(allowed: string[]) {
    const u = this.user();
    return !!u && allowed.includes(u.role);
  }
}

export const protectedGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  while (auth.loading()) await new Promise(r => setTimeout(r, 40));
  if (!auth.user()) return router.createUrlTree(['/login']);
  const allowed = route.data['roles'] as string[] | undefined;
  if (allowed && !auth.hasRole(allowed)) return router.createUrlTree(['/dashboard']);
  return true;
};

export const publicGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  while (auth.loading()) await new Promise(r => setTimeout(r, 40));
  return auth.user() ? router.createUrlTree(['/dashboard']) : true;
};
