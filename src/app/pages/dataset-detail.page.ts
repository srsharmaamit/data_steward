import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, Dataset, DataRecord, Anomaly } from '../api.service';
import { AuthService } from '../auth.service';
import { ToastService } from '../toast.service';
import { IconComponent } from '../icon.component';
import { StatusBadgeComponent } from '../status-badge.component';

@Component({
  selector: 'app-dataset-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent],
  template: `
  <div class="flex items-center justify-center min-h-[400px]" *ngIf="loading()">
    <i-lucide name="loader" class="h-8 w-8 text-muted-foreground"></i-lucide>
  </div>

  <div class="space-y-6 animate-fade-in" *ngIf="!loading() && dataset() as ds">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <button class="ui-btn ui-btn-ghost ui-btn-icon" (click)="back()">
          <i-lucide name="arrow-left" class="h-5 w-5"></i-lucide>
        </button>
        <div>
          <h1 class="text-2xl font-heading font-bold tracking-tight">{{ ds.name }}</h1>
          <div class="flex items-center gap-3 mt-1">
            <status-badge [status]="ds.status"></status-badge>
            <span class="text-sm text-muted-foreground">{{ total().toLocaleString() }} records</span>
            <span class="flex items-center gap-1 text-sm text-amber-600" *ngIf="ds.pii_fields.length > 0">
              <i-lucide name="shield" class="h-3.5 w-3.5"></i-lucide>
              {{ ds.pii_fields.length }} PII fields
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="ui-btn ui-btn-outline ui-btn-md" (click)="handleAnalyze()"
                [disabled]="analyzing() || records().length === 0">
          <i-lucide [name]="analyzing() ? 'loader' : 'sparkles'" class="mr-2 h-4 w-4"></i-lucide>
          AI Analysis
        </button>
        <button class="ui-btn ui-btn-default ui-btn-md" *ngIf="canSubmit()" (click)="submitDialogOpen.set(true)">
          <i-lucide name="send" class="mr-2 h-4 w-4"></i-lucide>
          Submit for Approval
        </button>
        <button class="ui-btn ui-btn-default ui-btn-md" *ngIf="canPublish()" (click)="publishDialogOpen.set(true)">
          <i-lucide name="upload" class="mr-2 h-4 w-4"></i-lucide>
          Publish to Data Lake
        </button>
      </div>
    </div>

    <!-- Description -->
    <div class="ui-card" *ngIf="ds.description">
      <div class="p-4"><p class="text-sm text-muted-foreground">{{ ds.description }}</p></div>
    </div>

    <!-- Data Table -->
    <div class="ui-card">
      <div class="ui-card-header pb-0">
        <h3 class="ui-card-title text-lg font-heading">Data Records</h3>
        <p class="ui-card-desc">{{ isEditable() ? 'Click on a row to edit values' : 'Viewing records (read-only)' }}</p>
      </div>
      <div class="p-0 mt-4">
        <div class="text-center py-12 text-muted-foreground" *ngIf="records().length === 0">No records found</div>

        <ng-container *ngIf="records().length > 0">
          <div class="overflow-x-auto">
            <table class="ui-table">
              <thead>
                <tr class="ui-tr">
                  <th class="ui-th w-[60px]">#</th>
                  <th class="ui-th" *ngFor="let col of columns()">
                    <div class="flex items-center gap-1">
                      {{ col }}
                      <i-lucide *ngIf="isPii(col)" name="shield" class="h-3 w-3 text-amber-500"></i-lucide>
                    </div>
                  </th>
                  <th class="ui-th w-[100px]" *ngIf="isEditable()">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr class="ui-tr" *ngFor="let record of records(); let idx = index"
                    [ngClass]="record.is_modified ? 'bg-amber-50 dark:bg-amber-900/10' : ''">
                  <td class="ui-td font-mono text-xs text-muted-foreground">{{ (page() - 1) * 20 + idx + 1 }}</td>
                  <td class="ui-td font-mono text-xs" *ngFor="let col of columns()">
                    <input *ngIf="editingRecord() === record.id; else readCell"
                           class="ui-input h-8 text-xs font-mono"
                           [ngModel]="editValues[col] ?? ''"
                           (ngModelChange)="editValues[col] = $event">
                    <ng-template #readCell>
                      <span [ngClass]="record.is_modified && record.data[col] !== record.original_data[col] ? 'text-amber-600 font-medium' : ''">
                        {{ record.data[col] || '-' }}
                      </span>
                    </ng-template>
                  </td>
                  <td class="ui-td" *ngIf="isEditable()">
                    <div class="flex items-center gap-1" *ngIf="editingRecord() === record.id; else editBtn">
                      <button class="ui-btn ui-btn-ghost ui-btn-icon" (click)="save(record.id)" [disabled]="saving()">
                        <i-lucide [name]="saving() ? 'loader' : 'save'"
                                  [class]="saving() ? 'h-4 w-4' : 'h-4 w-4 text-emerald-600'"></i-lucide>
                      </button>
                      <button class="ui-btn ui-btn-ghost ui-btn-icon" (click)="cancelEdit()">
                        <i-lucide name="x" class="h-4 w-4"></i-lucide>
                      </button>
                    </div>
                    <ng-template #editBtn>
                      <button class="ui-btn ui-btn-ghost ui-btn-icon" (click)="edit(record)">
                        <i-lucide name="edit" class="h-4 w-4"></i-lucide>
                      </button>
                    </ng-template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between p-4 border-t">
            <p class="text-sm text-muted-foreground">
              Showing {{ (page() - 1) * 20 + 1 }} - {{ min(page() * 20, total()) }} of {{ total() }}
            </p>
            <div class="flex items-center gap-2">
              <button class="ui-btn ui-btn-outline ui-btn-sm" (click)="setPage(page() - 1)" [disabled]="page() === 1">
                <i-lucide name="chevron-left" class="h-4 w-4"></i-lucide>
              </button>
              <span class="text-sm">Page {{ page() }} of {{ totalPages() }}</span>
              <button class="ui-btn ui-btn-outline ui-btn-sm" (click)="setPage(page() + 1)" [disabled]="page() === totalPages()">
                <i-lucide name="chevron-right" class="h-4 w-4"></i-lucide>
              </button>
            </div>
          </div>
        </ng-container>
      </div>
    </div>

    <!-- Submit for Approval Dialog -->
    <ng-container *ngIf="submitDialogOpen()">
      <div class="ui-overlay" (click)="submitDialogOpen.set(false)"></div>
      <div class="ui-dialog">
        <div class="flex flex-col space-y-1.5">
          <h2 class="ui-dialog-title">Submit for Approval</h2>
          <p class="ui-dialog-desc">Once submitted, the dataset will be locked for editing until approved or rejected.</p>
        </div>
        <div class="space-y-4 py-4">
          <textarea class="ui-textarea" rows="3" placeholder="Add comments for the approver (optional)"
                    [(ngModel)]="submitComments"></textarea>
        </div>
        <div class="ui-dialog-footer">
          <button class="ui-btn ui-btn-outline ui-btn-md" (click)="submitDialogOpen.set(false)">Cancel</button>
          <button class="ui-btn ui-btn-default ui-btn-md" (click)="handleSubmit()" [disabled]="submitting()">
            <i-lucide *ngIf="submitting()" name="loader" class="mr-2 h-4 w-4"></i-lucide>
            Submit
          </button>
        </div>
      </div>
    </ng-container>

    <!-- AI Analysis Dialog -->
    <ng-container *ngIf="analysisDialogOpen()">
      <div class="ui-overlay" (click)="analysisDialogOpen.set(false)"></div>
      <div class="ui-dialog max-w-2xl max-h-[80vh] overflow-y-auto">
        <div class="flex flex-col space-y-1.5">
          <h2 class="ui-dialog-title flex items-center gap-2">
            <i-lucide name="sparkles" class="h-5 w-5 text-purple-500"></i-lucide>
            AI Analysis Results
          </h2>
        </div>
        <div class="space-y-4 py-4" *ngIf="analysisResult() as res">
          <div>
            <h4 class="font-medium mb-2">Summary</h4>
            <p class="text-sm text-muted-foreground">{{ res.summary }}</p>
          </div>

          <div *ngIf="res.anomalies.length > 0">
            <h4 class="font-medium mb-2 flex items-center gap-2">
              <i-lucide name="alert-triangle" class="h-4 w-4 text-amber-500"></i-lucide>
              Detected Anomalies
            </h4>
            <div class="space-y-2">
              <div class="p-3 bg-muted rounded-md text-sm" *ngFor="let anomaly of res.anomalies">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-mono text-xs bg-background px-1 rounded">Row {{ anomaly.record_index + 1 }}</span>
                  <span class="font-medium">{{ anomaly.field }}</span>
                  <status-badge [status]="anomaly.severity === 'high' ? 'error' : anomaly.severity === 'medium' ? 'warning' : 'neutral'"></status-badge>
                </div>
                <p class="text-muted-foreground">{{ anomaly.issue }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="res.suggestions.length > 0">
            <h4 class="font-medium mb-2">Suggestions</h4>
            <ul class="list-disc list-inside space-y-1">
              <li class="text-sm text-muted-foreground" *ngFor="let suggestion of res.suggestions">{{ suggestion }}</li>
            </ul>
          </div>
        </div>
        <div class="ui-dialog-footer">
          <button class="ui-btn ui-btn-default ui-btn-md" (click)="analysisDialogOpen.set(false)">Close</button>
        </div>
      </div>
    </ng-container>

    <!-- Publish Dialog -->
    <ng-container *ngIf="publishDialogOpen()">
      <div class="ui-overlay" (click)="publishDialogOpen.set(false)"></div>
      <div class="ui-dialog">
        <div class="flex flex-col space-y-2">
          <h2 class="ui-dialog-title">Publish to Data Lake</h2>
          <p class="ui-dialog-desc">
            This will publish the dataset to the enterprise data lake (S3/Iceberg).
            The data will be available for downstream analytics and reporting.
          </p>
        </div>
        <div class="ui-dialog-footer">
          <button class="ui-btn ui-btn-outline ui-btn-md" (click)="publishDialogOpen.set(false)">Cancel</button>
          <button class="ui-btn ui-btn-default ui-btn-md" (click)="handlePublish()" [disabled]="publishing()">
            <i-lucide *ngIf="publishing()" name="loader" class="mr-2 h-4 w-4"></i-lucide>
            Publish
          </button>
        </div>
      </div>
    </ng-container>
  </div>
  `
})
export class DatasetDetailPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  id = '';
  dataset = signal<Dataset | null>(null);
  records = signal<DataRecord[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);
  total = signal(0);

  editingRecord = signal<string | null>(null);
  editValues: Record<string, string> = {};
  saving = signal(false);

  submitDialogOpen = signal(false);
  submitComments = '';
  submitting = signal(false);

  analyzing = signal(false);
  analysisResult = signal<{ summary: string; anomalies: Anomaly[]; suggestions: string[] } | null>(null);
  analysisDialogOpen = signal(false);

  publishDialogOpen = signal(false);
  publishing = signal(false);

  min = Math.min;

  ngOnInit() {
    this.route.paramMap.subscribe(p => {
      this.id = p.get('id') ?? '';
      this.fetchDataset();
    });
  }

  async fetchDataset() {
    this.loading.set(true);
    try {
      this.dataset.set(await this.api.getDataset(this.id));
      await this.fetchRecords();
    } catch {
      this.toast.error('Failed to load dataset');
      this.router.navigate(['/datasets']);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchRecords() {
    try {
      const res = await this.api.getRecords(this.id, this.page(), 20);
      this.records.set(res.records);
      this.totalPages.set(res.total_pages);
      this.total.set(res.total);
    } catch {
      this.toast.error('Failed to load records');
    }
  }

  setPage(p: number) {
    this.page.set(Math.min(Math.max(1, p), this.totalPages()));
    this.fetchRecords();
  }

  columns() { return this.dataset()?.schema_config?.columns ?? []; }
  isPii(col: string) { return (this.dataset()?.pii_fields ?? []).includes(col); }
  isEditable() { return ['draft', 'rejected'].includes(this.dataset()?.status ?? ''); }
  canSubmit() { return this.isEditable() && this.auth.hasRole(['admin', 'data_steward']); }
  canPublish() { return this.dataset()?.status === 'approved' && this.auth.hasRole(['admin', 'approver']); }

  edit(record: DataRecord) {
    this.editingRecord.set(record.id);
    this.editValues = { ...record.data };
  }

  cancelEdit() {
    this.editingRecord.set(null);
    this.editValues = {};
  }

  async save(recordId: string) {
    this.saving.set(true);
    try {
      const original = this.records().find(r => r.id === recordId)!;
      const changed: Record<string, string> = {};
      Object.keys(this.editValues).forEach(key => {
        if (this.editValues[key] !== original.data[key]) changed[key] = this.editValues[key];
      });
      if (Object.keys(changed).length > 0) {
        await this.api.patchRecord(this.id, recordId, changed);
        this.toast.success('Record updated');
        await this.fetchRecords();
      }
      this.cancelEdit();
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Failed to save changes');
    } finally {
      this.saving.set(false);
    }
  }

  async handleSubmit() {
    this.submitting.set(true);
    try {
      await this.api.submitApproval(this.id, this.submitComments);
      this.toast.success('Dataset submitted for approval');
      this.submitDialogOpen.set(false);
      this.submitComments = '';
      await this.fetchDataset();
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Failed to submit for approval');
    } finally {
      this.submitting.set(false);
    }
  }

  async handleAnalyze() {
    this.analyzing.set(true);
    try {
      const res = await this.api.analyze(this.id, 100);
      this.analysisResult.set(res);
      this.analysisDialogOpen.set(true);
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Analysis failed');
    } finally {
      this.analyzing.set(false);
    }
  }

  async handlePublish() {
    this.publishing.set(true);
    try {
      await this.api.publish(this.id);
      this.toast.success('Dataset published to data lake');
      this.publishDialogOpen.set(false);
      await this.fetchDataset();
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Failed to publish');
    } finally {
      this.publishing.set(false);
    }
  }

  back() { this.router.navigate(['/datasets']); }
}
