import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ApiService, Dataset } from '../api.service';
import { ToastService } from '../toast.service';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
  <!-- Tenant required guard -->
  <div class="max-w-2xl mx-auto" *ngIf="!auth.user()?.tenant_id; else wizard">
    <div class="ui-card border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
      <div class="p-6">
        <div class="flex items-start gap-4">
          <i-lucide name="alert-circle" class="h-6 w-6 text-amber-600 mt-1"></i-lucide>
          <div>
            <h3 class="font-heading font-semibold text-lg text-amber-800 dark:text-amber-400">Tenant Required</h3>
            <p class="text-amber-700 dark:text-amber-500 mt-1">
              You need to be assigned to a tenant before you can upload datasets.
              Please contact an administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ng-template #wizard>
  <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">
    <!-- Progress Steps -->
    <div class="flex items-center justify-center gap-4">
      <ng-container *ngFor="let s of [1, 2, 3]">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
               [ngClass]="step() >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'">
            <i-lucide *ngIf="step() > s" name="check-circle" class="h-4 w-4"></i-lucide>
            <span *ngIf="step() <= s">{{ s }}</span>
          </div>
          <div *ngIf="s < 3" class="w-16 h-1 mx-2 rounded" [ngClass]="step() > s ? 'bg-primary' : 'bg-muted'"></div>
        </div>
      </ng-container>
    </div>

    <!-- Step 1: Dataset Info -->
    <div class="ui-card" *ngIf="step() === 1">
      <div class="ui-card-header">
        <h3 class="ui-card-title flex items-center gap-2 font-heading">
          <i-lucide name="database" class="h-5 w-5"></i-lucide>
          Create Dataset
        </h3>
        <p class="ui-card-desc">Provide basic information about your dataset</p>
      </div>
      <div class="ui-card-content space-y-4">
        <div class="space-y-2">
          <label class="ui-label" for="dataset-name">Dataset Name</label>
          <input class="ui-input" id="dataset-name" placeholder="e.g., Customer Transactions Q4 2024"
                 [(ngModel)]="datasetName">
        </div>
        <div class="space-y-2">
          <label class="ui-label" for="dataset-description">Description (Optional)</label>
          <textarea class="ui-textarea" id="dataset-description" rows="3"
                    placeholder="Brief description of the dataset contents and purpose..."
                    [(ngModel)]="datasetDescription"></textarea>
        </div>
        <div class="flex justify-end">
          <button class="ui-btn ui-btn-default ui-btn-md" (click)="handleCreateDataset()"
                  [disabled]="!datasetName.trim() || loading()">
            <i-lucide *ngIf="loading()" name="loader" class="mr-2 h-4 w-4"></i-lucide>
            Continue
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: File Upload -->
    <div class="ui-card" *ngIf="step() === 2">
      <div class="ui-card-header">
        <h3 class="ui-card-title flex items-center gap-2 font-heading">
          <i-lucide name="file-up" class="h-5 w-5"></i-lucide>
          Upload Data File
        </h3>
        <p class="ui-card-desc">Upload a CSV file to populate your dataset</p>
      </div>
      <div class="ui-card-content space-y-4">
        <!-- PII Fields -->
        <div class="space-y-2">
          <label class="ui-label flex items-center gap-2" for="pii-fields">
            <i-lucide name="shield" class="h-4 w-4"></i-lucide>
            PII Fields (comma-separated)
          </label>
          <input class="ui-input" id="pii-fields" placeholder="e.g., email, ssn, phone_number, account_number"
                 [(ngModel)]="piiFields">
          <p class="text-xs text-muted-foreground">
            Mark sensitive columns that should be masked for unauthorized users
          </p>
        </div>

        <!-- Drop Zone -->
        <div class="relative border-2 border-dashed rounded-lg p-8 transition-colors"
             [ngClass]="dragActive() ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'"
             (dragenter)="onDrag($event, true)" (dragover)="onDrag($event, true)"
             (dragleave)="onDrag($event, false)" (drop)="onDrop($event)">
          <input type="file" accept=".csv" (change)="onFileSelect($event)"
                 class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">

          <div class="text-center">
            <div class="space-y-2" *ngIf="file(); else noFile">
              <i-lucide name="check-circle" class="h-10 w-10 mx-auto text-emerald-600"></i-lucide>
              <div>
                <p class="font-medium">{{ file()!.name }}</p>
                <p class="text-sm text-muted-foreground">{{ formatFileSize(file()!.size) }}</p>
              </div>
              <button class="ui-btn ui-btn-ghost ui-btn-sm relative z-10" (click)="clearFile($event)">
                <i-lucide name="x" class="h-4 w-4 mr-1"></i-lucide>
                Remove
              </button>
            </div>
            <ng-template #noFile>
              <i-lucide name="upload" class="h-10 w-10 mx-auto text-muted-foreground mb-3"></i-lucide>
              <p class="font-medium">Drop your CSV file here</p>
              <p class="text-sm text-muted-foreground mt-1">or click to browse</p>
            </ng-template>
          </div>
        </div>

        <!-- Upload Progress -->
        <div class="space-y-2" *ngIf="loading()">
          <div class="ui-progress"><div class="ui-progress-bar" [style.width.%]="uploadProgress()"></div></div>
          <p class="text-sm text-center text-muted-foreground">Uploading... {{ uploadProgress() }}%</p>
        </div>

        <div class="flex justify-between">
          <button class="ui-btn ui-btn-outline ui-btn-md" (click)="step.set(1)">Back</button>
          <button class="ui-btn ui-btn-default ui-btn-md" (click)="handleUploadFile()"
                  [disabled]="!file() || loading()">
            <i-lucide *ngIf="loading()" name="loader" class="mr-2 h-4 w-4"></i-lucide>
            Upload File
          </button>
        </div>
      </div>
    </div>

    <!-- Step 3: Success -->
    <div class="ui-card" *ngIf="step() === 3">
      <div class="p-8 text-center">
        <i-lucide name="check-circle" class="h-16 w-16 mx-auto text-emerald-600 mb-4"></i-lucide>
        <h2 class="text-2xl font-heading font-bold mb-2">Dataset Created Successfully!</h2>
        <p class="text-muted-foreground mb-6">Your data has been uploaded and is ready for review.</p>
        <div class="flex justify-center gap-4">
          <button class="ui-btn ui-btn-outline ui-btn-md" (click)="reset()">Upload Another</button>
          <button class="ui-btn ui-btn-default ui-btn-md" (click)="goReview()">Review Dataset</button>
        </div>
      </div>
    </div>
  </div>
  </ng-template>
  `
})
export class UploadPage {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  step = signal(1);
  loading = signal(false);
  uploadProgress = signal(0);
  dragActive = signal(false);
  file = signal<File | null>(null);

  datasetName = '';
  datasetDescription = '';
  piiFields = '';
  createdDataset: Dataset | null = null;

  onDrag(e: DragEvent, active: boolean) {
    e.preventDefault(); e.stopPropagation();
    this.dragActive.set(active);
  }

  onDrop(e: DragEvent) {
    e.preventDefault(); e.stopPropagation();
    this.dragActive.set(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) this.acceptFile(dropped);
  }

  onFileSelect(e: Event) {
    const selected = (e.target as HTMLInputElement).files?.[0];
    if (selected) this.acceptFile(selected);
  }

  private acceptFile(f: File) {
    if (f.type === 'text/csv' || f.name.endsWith('.csv')) this.file.set(f);
    else this.toast.error('Please upload a CSV file');
  }

  clearFile(e: Event) { e.preventDefault(); e.stopPropagation(); this.file.set(null); }

  async handleCreateDataset() {
    if (!this.auth.user()?.tenant_id) {
      this.toast.error('You must be assigned to a tenant to create datasets');
      return;
    }
    this.loading.set(true);
    try {
      this.createdDataset = await this.api.createDataset(this.datasetName, this.datasetDescription);
      this.step.set(2);
      this.toast.success('Dataset created successfully');
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Failed to create dataset');
    } finally {
      this.loading.set(false);
    }
  }

  async handleUploadFile() {
    const f = this.file();
    if (!f || !this.createdDataset) return;
    this.loading.set(true);
    this.uploadProgress.set(0);
    try {
      await this.api.uploadCsv(this.createdDataset.id, f, this.piiFields,
        pct => this.uploadProgress.set(pct));
      this.step.set(3);
      this.toast.success('File uploaded successfully');
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Failed to upload file');
    } finally {
      this.loading.set(false);
    }
  }

  formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  reset() {
    this.step.set(1);
    this.datasetName = '';
    this.datasetDescription = '';
    this.file.set(null);
    this.piiFields = '';
    this.createdDataset = null;
  }

  goReview() { this.router.navigate(['/datasets', this.createdDataset!.id]); }
}
