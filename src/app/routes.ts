import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './auth.service';
import { LayoutComponent } from './layout.component';
import { LoginComponent } from './pages/login.component';
import { DashboardComponent } from './pages/dashboard.component';
import { DatasetsComponent } from './pages/datasets.component';
import { DatasetDetailComponent } from './pages/dataset-detail.component';
import { UploadComponent } from './pages/upload.component';
import { ApprovalsComponent } from './pages/approvals.component';
import { AuditPageComponent } from './pages/audit-page.component';
import { AdminComponent } from './pages/admin.component';
import { SettingsComponent } from './pages/settings.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'datasets', component: DatasetsComponent },
      { path: 'datasets/:id', component: DatasetDetailComponent },
      { path: 'upload', component: UploadComponent },
      { path: 'approvals', component: ApprovalsComponent },
      { path: 'audit', component: AuditPageComponent },
      { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
