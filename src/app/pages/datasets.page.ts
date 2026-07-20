import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, Dataset } from '../api.service';
import { ToastService } from '../toast.service';
import { IconComponent } from '../icon.component';
import { StatusBadgeComponent } from '../status-badge.component';

@Component({
  selector: 'app-datasets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, StatusBadgeComponent],
  template: `
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-heading font-bold tracking-tight">Datasets</h1>
        <p class="text-muted-foreground">View and manage your data review workflows</p>
      </div>
      <a routerLink="/upload">
        <button class="ui-btn ui-btn-default ui-btn-md">
          <i-lucide name="upload" class="mr-2 h-4 w-4"></i-lucide>
          New Dataset
        </button>
      </a>
    </div>

    <!-- Filters -->
    <div class="ui-card">
      <div class="p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="relative flex-1">
            <i-lucide name="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"></i-lucide>
            <input class="ui-input pl-9" placeholder="Search datasets..." [(ngModel)]="searchQuery">
          </div>
          <select class="ui-select w-full md:w-48" [ngModel]="statusFilter()" (ngModelChange)="setStatus($event)">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="ui-card">
      <div class="p-0">
        <div class="flex items-center justify-center py-12" *ngIf="loading()">
          <i-lucide name="loader" class="h-8 w-8 text-muted-foreground"></i-lucide>
        </div>

        <div class="text-center py-12" *ngIf="!loading() && filtered().length === 0">
          <i-lucide name="file-search" class="h-12 w-12 mx-auto text-muted-foreground mb-4"></i-lucide>
          <h3 class="font-heading font-semibold text-lg mb-1">No datasets found</h3>
          <p class="text-muted-foreground mb-4">
            {{ searchQuery || statusFilter() !== 'all' ? 'Try adjusting your filters' : 'Get started by uploading your first dataset' }}
          </p>
          <a routerLink="/upload" *ngIf="!searchQuery && statusFilter() === 'all'">
            <button class="ui-btn ui-btn-default ui-btn-md">
              <i-lucide name="upload" class="mr-2 h-4 w-4"></i-lucide>
              Upload Data
            </button>
          </a>
        </div>

        <table class="ui-table" *ngIf="!loading() && filtered().length > 0">
          <thead>
            <tr class="ui-tr">
              <th class="ui-th">Name</th>
              <th class="ui-th">Status</th>
              <th class="ui-th">Records</th>
              <th class="ui-th">Created</th>
              <th class="ui-th w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            <tr class="ui-tr cursor-pointer" *ngFor="let dataset of filtered()"
                (click)="open(dataset.id)">
              <td class="ui-td">
                <div>
                  <p class="font-medium">{{ dataset.name }}</p>
                  <p class="text-xs text-muted-foreground truncate max-w-xs" *ngIf="dataset.description">
                    {{ dataset.description }}
                  </p>
                </div>
              </td>
              <td class="ui-td"><status-badge [status]="dataset.status"></status-badge></td>
              <td class="ui-td font-mono text-sm">{{ dataset.record_count.toLocaleString() }}</td>
              <td class="ui-td text-muted-foreground text-sm">{{ formatDate(dataset.created_at) }}</td>
              <td class="ui-td">
                <div class="relative" (click)="$event.stopPropagation()">
                  <button class="ui-btn ui-btn-ghost ui-btn-icon" (click)="toggleMenu(dataset.id)">
                    <i-lucide name="more-vertical" class="h-4 w-4"></i-lucide>
                  </button>
                  <div class="ui-menu right-0 mt-1" *ngIf="openMenuId() === dataset.id">
                    <button class="ui-menu-item" (click)="open(dataset.id)">
                      <i-lucide name="eye" class="h-4 w-4 mr-2"></i-lucide>
                      View Details
                    </button>
                    <button class="ui-menu-item text-destructive" (click)="askDelete(dataset)">
                      <i-lucide name="trash" class="h-4 w-4 mr-2"></i-lucide>
                      Delete
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <ng-container *ngIf="deleteDialogOpen()">
      <div class="ui-overlay" (click)="deleteDialogOpen.set(false)"></div>
      <div class="ui-dialog">
        <div class="flex flex-col space-y-2 text-center sm:text-left">
          <h2 class="ui-dialog-title">Delete Dataset</h2>
          <p class="ui-dialog-desc">
            Are you sure you want to delete "{{ datasetToDelete?.name }}"? This action cannot be undone
            and will remove all associated records.
          </p>
        </div>
        <div class="ui-dialog-footer">
          <button class="ui-btn ui-btn-outline ui-btn-md" (click)="deleteDialogOpen.set(false)">Cancel</button>
          <button class="ui-btn ui-btn-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  (click)="confirmDelete()">Delete</button>
        </div>
      </div>
    </ng-container>
  </div>
  `
})
export class DatasetsPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  datasets = signal<Dataset[]>([]);
  loading = signal(true);
  searchQuery = '';
  statusFilter = signal('all');
  openMenuId = signal<string | null>(null);
  deleteDialogOpen = signal(false);
  datasetToDelete: Dataset | null = null;

  @HostListener('document:click') closeMenus() { this.openMenuId.set(null); }

  ngOnInit() { this.fetch(); }

  async fetch() {
    try {
      this.datasets.set(await this.api.listDatasets(this.statusFilter()));
    } catch {
      this.toast.error('Failed to fetch datasets');
    } finally {
      this.loading.set(false);
    }
  }

  setStatus(v: string) { this.statusFilter.set(v); this.fetch(); }

  filtered() {
    const q = this.searchQuery.toLowerCase();
    return this.datasets().filter(d => d.name.toLowerCase().includes(q));
  }

  toggleMenu(id: string) { this.openMenuId.update(m => m === id ? null : id); }

  open(id: string) { this.router.navigate(['/datasets', id]); }

  askDelete(d: Dataset) {
    this.openMenuId.set(null);
    this.datasetToDelete = d;
    this.deleteDialogOpen.set(true);
  }

  async confirmDelete() {
    if (!this.datasetToDelete) return;
    try {
      await this.api.deleteDataset(this.datasetToDelete.id);
      this.toast.success('Dataset deleted');
      this.fetch();
    } catch (error: any) {
      this.toast.error(error?.response?.data?.detail || 'Failed to delete dataset');
    } finally {
      this.deleteDialogOpen.set(false);
      this.datasetToDelete = null;
    }
  }

  formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
