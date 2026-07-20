import { Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { protectedGuard, publicGuard } from './auth.service';
import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';
import { UploadPage } from './pages/upload.page';
import { DatasetsPage } from './pages/datasets.page';
import { DatasetDetailPage } from './pages/dataset-detail.page';
import { ApprovalsPage } from './pages/approvals.page';
import { AuditLogsPage } from './pages/audit-logs.page';
import { AdminPage } from './pages/admin.page';
import { SettingsPage } from './pages/settings.page';

const ALL = ['admin', 'data_steward', 'approver'];

export const routes: Routes = [
  { path: 'login', component: LoginPage, canActivate: [publicGuard] },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [protectedGuard],
    canActivateChild: [protectedGuard],
    children: [
      { path: 'dashboard', component: DashboardPage, data: { roles: ALL } },
      { path: 'upload', component: UploadPage, data: { roles: ['admin', 'data_steward'] } },
      { path: 'datasets', component: DatasetsPage, data: { roles: ALL } },
      { path: 'datasets/:id', component: DatasetDetailPage, data: { roles: ALL } },
      { path: 'approvals', component: ApprovalsPage, data: { roles: ['admin', 'approver'] } },
      { path: 'audit-logs', component: AuditLogsPage, data: { roles: ALL } },
      { path: 'admin', component: AdminPage, data: { roles: ['admin'] } },
      { path: 'settings', component: SettingsPage, data: { roles: ALL } },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
