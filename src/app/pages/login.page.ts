import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastService } from '../toast.service';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
  <div class="min-h-screen flex">
    <!-- Left panel - Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
      <div class="w-full max-w-md space-y-8">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <i-lucide name="database" class="h-10 w-10 text-primary"></i-lucide>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-heading font-bold text-2xl tracking-tight">StewardData Hub</h1>
              <span class="status-badge border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Angular</span>
            </div>
            <p class="text-sm text-muted-foreground">Enterprise Data Review Platform &middot; Angular Edition</p>
          </div>
        </div>

        <div class="w-full">
          <div class="ui-tabs-list grid w-full grid-cols-2">
            <button class="ui-tabs-trigger" [ngClass]="{'ui-tabs-trigger-active': tab() === 'login'}"
                    (click)="tab.set('login')">Sign In</button>
            <button class="ui-tabs-trigger" [ngClass]="{'ui-tabs-trigger-active': tab() === 'register'}"
                    (click)="tab.set('register')">Create Account</button>
          </div>

          <!-- Sign In -->
          <div class="mt-6" *ngIf="tab() === 'login'">
            <div class="ui-card">
              <div class="ui-card-header space-y-1">
                <h3 class="ui-card-title text-xl font-heading">Welcome back</h3>
                <p class="ui-card-desc">Enter your credentials to access your account</p>
              </div>
              <div class="ui-card-content">
                <form class="space-y-4" (ngSubmit)="handleLogin()">
                  <div class="space-y-2">
                    <label class="ui-label" for="login-email">Email</label>
                    <input class="ui-input" id="login-email" name="loginEmail" type="email"
                           placeholder="name@company.com" [(ngModel)]="loginEmail" required>
                  </div>
                  <div class="space-y-2">
                    <label class="ui-label" for="login-password">Password</label>
                    <div class="relative">
                      <input class="ui-input" id="login-password" name="loginPassword"
                             [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••"
                             [(ngModel)]="loginPassword" required>
                      <button type="button" (click)="showPassword.set(!showPassword())"
                              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <i-lucide [name]="showPassword() ? 'eye-off' : 'eye'" class="h-4 w-4"></i-lucide>
                      </button>
                    </div>
                  </div>
                  <button type="submit" class="ui-btn ui-btn-default ui-btn-md w-full" [disabled]="loading()">
                    <i-lucide *ngIf="loading()" name="loader" class="mr-2 h-4 w-4"></i-lucide>
                    Sign In
                  </button>
                </form>
              </div>
            </div>
          </div>

          <!-- Create Account -->
          <div class="mt-6" *ngIf="tab() === 'register'">
            <div class="ui-card">
              <div class="ui-card-header space-y-1">
                <h3 class="ui-card-title text-xl font-heading">Create an account</h3>
                <p class="ui-card-desc">Enter your details to get started</p>
              </div>
              <div class="ui-card-content">
                <form class="space-y-4" (ngSubmit)="handleRegister()">
                  <div class="space-y-2">
                    <label class="ui-label" for="reg-name">Full Name</label>
                    <input class="ui-input" id="reg-name" name="regName" type="text"
                           placeholder="John Doe" [(ngModel)]="regName" required>
                  </div>
                  <div class="space-y-2">
                    <label class="ui-label" for="reg-email">Email</label>
                    <input class="ui-input" id="reg-email" name="regEmail" type="email"
                           placeholder="name@company.com" [(ngModel)]="regEmail" required>
                  </div>
                  <div class="space-y-2">
                    <label class="ui-label" for="reg-password">Password</label>
                    <input class="ui-input" id="reg-password" name="regPassword" type="password"
                           placeholder="••••••••" [(ngModel)]="regPassword" required minlength="6">
                  </div>
                  <div class="space-y-2">
                    <label class="ui-label" for="reg-role">Role</label>
                    <select class="ui-select" id="reg-role" name="regRole" [(ngModel)]="regRole">
                      <option value="admin">Admin</option>
                      <option value="data_steward">Data Steward</option>
                      <option value="approver">Approver</option>
                    </select>
                  </div>
                  <button type="submit" class="ui-btn ui-btn-default ui-btn-md w-full" [disabled]="loading()">
                    <i-lucide *ngIf="loading()" name="loader" class="mr-2 h-4 w-4"></i-lucide>
                    Create Account
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- Demo credentials -->
        <div class="text-center text-sm text-muted-foreground">
          <p>Demo: Register with any email to get started</p>
        </div>
      </div>
    </div>

    <!-- Right panel - Image -->
    <div class="hidden lg:block lg:w-1/2 bg-muted relative overflow-hidden">
      <div class="absolute inset-0 bg-cover bg-center"
           style="background-image: url('https://images.pexels.com/photos/12732218/pexels-photo-12732218.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')"></div>
      <div class="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
      <div class="absolute bottom-8 left-8 right-8 text-white">
        <h2 class="font-heading font-bold text-3xl mb-2">Enterprise Data Governance</h2>
        <p class="text-white/80 max-w-md">
          Secure, audited data review and approval workflows for financial institutions.
        </p>
      </div>
    </div>
  </div>
  `
})
export class LoginPage {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  tab = signal<'login' | 'register'>('login');
  loading = signal(false);
  showPassword = signal(false);

  loginEmail = '';
  loginPassword = '';
  regName = '';
  regEmail = '';
  regPassword = '';
  regRole: 'admin' | 'data_steward' | 'approver' = 'data_steward';

  async handleLogin() {
    this.loading.set(true);
    try {
      await this.auth.login(this.loginEmail, this.loginPassword);
      this.toast.success('Welcome back!');
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Login failed');
    } finally {
      this.loading.set(false);
    }
  }

  async handleRegister() {
    this.loading.set(true);
    try {
      await this.auth.register(this.regEmail, this.regPassword, this.regName, this.regRole);
      this.toast.success('Account created successfully!');
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }
}
