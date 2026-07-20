import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../data.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Upload dataset</h1>
        <p>Large files stream to staging in parts via pre-signed URLs — nothing touches the lake until approval</p>
      </div>
    </div>

    <div class="drop card"
         [class.over]="over()"
         (dragover)="$event.preventDefault(); over.set(true)"
         (dragleave)="over.set(false)"
         (drop)="onDrop($event)"
         *ngIf="!uploading() && !done()">
      <div class="glyph">⇪</div>
      <p class="big">Drop a CSV here, or</p>
      <label class="btn primary">
        Choose file
        <input type="file" accept=".csv,.tsv" (change)="onPick($event)" hidden>
      </label>
      <p class="small">Up to 5 GB · multipart, resumable · validation rules run on arrival</p>
    </div>

    <div class="card prog" *ngIf="uploading()">
      <p class="mono nm">{{ fileName() }}</p>
      <div class="track"><div class="fill" [style.width.%]="pct()"></div></div>
      <p class="mono small">part {{ part() }} / {{ totalParts }} · {{ pct() }}% · streaming to
        tenant-alpha-bank/stage via pre-signed URL</p>
    </div>

    <div class="card donebox" *ngIf="done()">
      <p class="big">✓ Staged and scanned</p>
      <p class="small">Validation flagged {{ flagged }} records for review. The dataset is now in your queue.</p>
      <button class="btn primary" (click)="goReview()">Review it now</button>
    </div>
  </div>
  `,
  styles: [`
    .drop { border: 2px dashed var(--line-strong); text-align: center; padding: 56px 20px; transition: border-color .12s; }
    .drop.over { border-color: var(--verdigris); background: var(--verdigris-soft); }
    .glyph { font-size: 34px; color: var(--verdigris); margin-bottom: 8px; }
    .big { font-size: 15px; font-weight: 600; margin: 0 0 14px; color: var(--ink-soft); }
    .small { font-size: 11.5px; color: var(--text-dim); margin: 14px 0 0; }
    .btn.primary { display: inline-block; }
    .prog .nm { font-weight: 600; margin: 0 0 10px; }
    .track { height: 10px; border-radius: 5px; background: var(--surface); border: 1px solid var(--line); overflow: hidden; }
    .fill { height: 100%; background: var(--verdigris); transition: width .18s; }
    .donebox { text-align: center; padding: 40px 20px; }
    .donebox .big { color: var(--verdigris); }
    .donebox .btn { margin-top: 14px; }
  `]
})
export class UploadComponent {
  svc = inject(DataService);
  private router = inject(Router);

  over = signal(false);
  uploading = signal(false);
  done = signal(false);
  part = signal(0);
  fileName = signal('');
  totalParts = 20;
  flagged = 2;

  pct() { return Math.round((this.part() / this.totalParts) * 100); }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.over.set(false);
    const f = e.dataTransfer?.files?.[0];
    this.start(f?.name ?? 'positions_eod.csv');
  }

  onPick(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    this.start(f?.name ?? 'positions_eod.csv');
  }

  start(name: string) {
    this.fileName.set(name);
    this.uploading.set(true);
    this.part.set(0);
    const tick = () => {
      if (this.part() >= this.totalParts) {
        this.svc.simulateUpload();
        this.uploading.set(false);
        this.done.set(true);
        return;
      }
      this.part.update(p => p + 1);
      setTimeout(tick, 90);
    };
    tick();
  }

  goReview() { this.router.navigate(['/datasets', this.svc.selectedId()]); }
}
