import { Injectable, computed, inject, signal } from '@angular/core';
import { AuditEvent, ColumnDef, DataRecord, Dataset, UserContext } from './models';
import { AuthService } from './auth.service';

/**
 * Demo data layer. Set API_URL to your Spring Boot service (e.g. the tenant's
 * ingress, https://tenant-a.datasteward.internal/api) and replace the mutation
 * methods with HttpClient calls — the shapes in models.ts match the REST contract.
 * Left as in-memory state so the Vercel deployment demos the full workflow standalone.
 */
export const API_URL: string | null = null;

const COLS: ColumnDef[] = [
  { key: 'accountId', label: 'Account ID', pii: false, editable: false, type: 'text' },
  { key: 'fullName', label: 'Full name', pii: true, editable: true, type: 'text' },
  { key: 'email', label: 'Email', pii: true, editable: true, type: 'text' },
  { key: 'iban', label: 'IBAN', pii: true, editable: true, type: 'text' },
  { key: 'country', label: 'Country', pii: false, editable: true, type: 'text' },
  { key: 'balance', label: 'Balance (GBP)', pii: false, editable: true, type: 'number' },
  { key: 'riskRating', label: 'Risk', pii: false, editable: true, type: 'text' },
  { key: 'kycStatus', label: 'KYC', pii: false, editable: true, type: 'text' }
];

function rec(id: string, v: string[], flags: { [k: string]: string } = {}): DataRecord {
  const keys = COLS.map(c => c.key);
  const values: any = {};
  keys.forEach((k, i) => values[k] = v[i]);
  return { id, values, flags, edited: {} };
}

const DS1_RECORDS: DataRecord[] = [
  rec('R-0001', ['ACC-118820', 'Margaret Whitelaw', 'm.whitelaw@example.co.uk', 'GB29NWBK60161331926819', 'GB', '18240.55', 'LOW', 'VERIFIED']),
  rec('R-0002', ['ACC-118821', 'Sanjay Mehra', 'sanjay.mehra@exmaple.com', 'GB94BARC10201530093459', 'GB', '204118.00', 'MEDIUM', 'VERIFIED'],
    { email: 'Domain "exmaple.com" fails MX lookup — likely typo' }),
  rec('R-0003', ['ACC-118822', 'Aoife Ní Bhraonáin', 'aoife.nb@example.ie', 'IE29AIBK93115212345678', 'IE', '-312.40', 'LOW', 'VERIFIED'],
    { balance: 'Negative balance on savings product' }),
  rec('R-0004', ['ACC-118823', 'Tomasz Kowalczyk', 't.kowalczyk@example.pl', 'PL61109010140000071219812874', 'PL', '55910.10', 'HIGH', 'PENDING'],
    { kycStatus: 'KYC pending > 90 days on HIGH risk account' }),
  rec('R-0005', ['ACC-118824', 'Fatima Al-Rashid', 'fatima.ar@example.com', 'GB33BUKB20201555555555', 'UK', '77201.90', 'LOW', 'VERIFIED'],
    { country: 'Non-ISO code "UK" — expected "GB"' }),
  rec('R-0006', ['ACC-118825', 'Duncan McAllister', 'd.mcallister@example.co.uk', 'GB12CPBK08929965044991', 'GB', '910.00', 'LOW', 'VERIFIED']),
  rec('R-0007', ['ACC-118826', 'Priya Raghunathan', 'priya.r@example.in', 'GB82WEST12345698765432', 'GB', '132880.25', 'MEDIUM', 'VERIFIED']),
  rec('R-0008', ['ACC-118827', 'Björn Sørensen', 'bjorn.s@example.dk', 'DK5000400440116243', 'DK', '4402.13', 'LOW', 'EXPIRED'],
    { kycStatus: 'KYC evidence expired 2026-05-30' })
];

const DS2_RECORDS: DataRecord[] = [
  rec('R-0101', ['ACC-220401', 'Hannah Osei', 'h.osei@example.com', 'GB29NWBK60161331900011', 'GB', '3300.00', 'LOW', 'VERIFIED']),
  rec('R-0102', ['ACC-220402', 'Luca Moretti', 'l.moretti@example.it', 'IT60X0542811101000000123456', 'IT', '88112.70', 'MEDIUM', 'VERIFIED'])
];
DS2_RECORDS[1].edited['riskRating'] = 'HIGH';
DS2_RECORDS[1].values['riskRating'] = 'MEDIUM';

const DS3_RECORDS: DataRecord[] = [
  rec('R-0201', ['ACC-990110', 'Grace Adeyemi', 'g.adeyemi@example.com', 'GB29NWBK60161331922288', 'GB', '15020.00', 'LOW', 'VERIFIED'])
];

let SEQ = 100;
const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

@Injectable({ providedIn: 'root' })
export class DataService {

  private auth = inject(AuthService);

  /** Identity now comes from the login session. */
  readonly user = computed<UserContext & { email?: string; admin?: boolean }>(() =>
    this.auth.user() ?? { name: 'Guest', role: 'ANALYST', tenant: 'tenant-alpha-bank', piiAccess: false });

  readonly datasets = signal<Dataset[]>([
    {
      id: 'DS-2026-0714', name: 'customer_master_2026Q3.csv', source: 'SFTP drop · core banking',
      sizeLabel: '3.2 GB · multipart ×26', uploadedBy: 'ingest-svc', uploadedAt: '2026-07-14 06:12 UTC',
      status: 'IN_REVIEW', recordCount: 8, flaggedCount: 5, columns: COLS, records: DS1_RECORDS
    },
    {
      id: 'DS-2026-0711', name: 'kyc_refresh_batch_112.csv', source: 'REST ingest · KYC vendor',
      sizeLabel: '412 MB', uploadedBy: 'j.crawford', uploadedAt: '2026-07-11 14:47 UTC',
      status: 'PENDING_APPROVAL', recordCount: 2, flaggedCount: 0, columns: COLS, records: DS2_RECORDS
    },
    {
      id: 'DS-2026-0702', name: 'onboarding_backfill_jun.csv', source: 'UI upload',
      sizeLabel: '1.1 GB · multipart ×9', uploadedBy: 'a.sharma', uploadedAt: '2026-07-02 09:03 UTC',
      status: 'PUBLISHED', recordCount: 1, flaggedCount: 0, snapshotId: '8412963057219', columns: COLS, records: DS3_RECORDS
    }
  ]);

  readonly selectedId = signal<string>('DS-2026-0714');
  readonly selected = computed(() =>
    this.datasets().find(d => d.id === this.selectedId()) ?? this.datasets()[0]);

  readonly audit = signal<AuditEvent[]>([
    { id: 1, at: '2026-07-14 06:12:04 UTC', actor: 'ingest-svc', role: 'DATA_STEWARD', action: 'UPLOAD', datasetId: 'DS-2026-0714', note: '26 parts committed to staging (tenant-alpha-bank/stage/2026-07-14)' },
    { id: 2, at: '2026-07-11 15:02:11 UTC', actor: 'j.crawford', role: 'DATA_STEWARD', action: 'EDIT', datasetId: 'DS-2026-0711', recordId: 'R-0102', field: 'riskRating', oldValue: 'HIGH', newValue: 'MEDIUM', note: 'Aligned with vendor re-score' },
    { id: 3, at: '2026-07-11 15:04:38 UTC', actor: 'j.crawford', role: 'DATA_STEWARD', action: 'SUBMIT', datasetId: 'DS-2026-0711', note: '1 correction · awaiting second-person review' },
    { id: 4, at: '2026-07-02 11:40:19 UTC', actor: 'm.boyd', role: 'APPROVER', action: 'APPROVE', datasetId: 'DS-2026-0702' },
    { id: 5, at: '2026-07-02 11:40:24 UTC', actor: 'system', role: 'APPROVER', action: 'PUBLISH', datasetId: 'DS-2026-0702', note: 'Iceberg snapshot 8412963057219 committed · lake.alpha_bank.customer_master' }
  ]);

  private log(e: Omit<AuditEvent, 'id' | 'at'>) {
    this.audit.update(a => [{ id: ++SEQ, at: now(), ...e }, ...a]);
  }


  select(id: string) { this.selectedId.set(id); }

  canEdit(): boolean {
    return this.user().role === 'DATA_STEWARD' && this.selected().status === 'IN_REVIEW';
  }

  editCell(recordId: string, field: string, value: string) {
    if (!this.canEdit()) return;
    const ds = this.selected();
    const r = ds.records.find(x => x.id === recordId);
    if (!r || r.values[field] === value) return;
    const oldValue = r.values[field];
    if (!(field in r.edited)) r.edited[field] = oldValue;
    r.values[field] = value;
    delete r.flags[field];
    this.datasets.update(list => [...list]);
    this.log({ actor: this.user().name, role: this.user().role, action: 'EDIT', datasetId: ds.id, recordId, field, oldValue, newValue: value });
  }

  logPiiReveal(recordId: string, field: string) {
    this.log({ actor: this.user().name, role: this.user().role, action: 'PII_REVEAL', datasetId: this.selected().id, recordId, field, note: 'Unmasked in review UI' });
  }

  submitForApproval() {
    const ds = this.selected();
    if (ds.status !== 'IN_REVIEW') return;
    const edits = ds.records.reduce((n, r) => n + Object.keys(r.edited).length, 0);
    ds.status = 'PENDING_APPROVAL';
    this.datasets.update(l => [...l]);
    this.log({ actor: this.user().name, role: this.user().role, action: 'SUBMIT', datasetId: ds.id, note: `${edits} correction${edits === 1 ? '' : 's'} · dataset locked for second-person review` });
  }

  approve() {
    const ds = this.selected();
    if (ds.status !== 'PENDING_APPROVAL' || this.user().role !== 'APPROVER') return;
    ds.status = 'PUBLISHED';
    ds.snapshotId = String(Math.floor(1e12 + Math.random() * 9e12));
    this.datasets.update(l => [...l]);
    this.log({ actor: this.user().name, role: this.user().role, action: 'APPROVE', datasetId: ds.id });
    this.log({ actor: 'system', role: this.user().role, action: 'PUBLISH', datasetId: ds.id, note: `Iceberg snapshot ${ds.snapshotId} committed · lake.alpha_bank.customer_master` });
  }

  reject() {
    const ds = this.selected();
    if (ds.status !== 'PENDING_APPROVAL' || this.user().role !== 'APPROVER') return;
    ds.status = 'IN_REVIEW';
    this.datasets.update(l => [...l]);
    this.log({ actor: this.user().name, role: this.user().role, action: 'REJECT', datasetId: ds.id, note: 'Returned to steward for rework' });
  }

  pendingEdits(ds: Dataset) {
    const out: { recordId: string; field: string; from: string; to: string }[] = [];
    for (const r of ds.records) {
      for (const f of Object.keys(r.edited)) {
        out.push({ recordId: r.id, field: f, from: r.edited[f], to: r.values[f] });
      }
    }
    return out;
  }

  simulateUpload() {
    const id = 'DS-2026-07' + String(18 + this.datasets().length);
    const ds: Dataset = {
      id, name: 'positions_eod_' + id.slice(-2) + '.csv', source: 'UI upload · multipart',
      sizeLabel: '2.4 GB · multipart ×20', uploadedBy: this.user().name, uploadedAt: now(),
      status: 'IN_REVIEW', recordCount: 8, flaggedCount: 2, columns: COLS,
      records: DS1_RECORDS.map((r, i) => ({ ...r, id: 'R-1' + String(i).padStart(3, '0'), values: { ...r.values }, flags: { ...r.flags }, edited: {} }))
    };
    this.datasets.update(l => [ds, ...l]);
    this.selectedId.set(id);
    this.log({ actor: this.user().name, role: this.user().role, action: 'UPLOAD', datasetId: id, note: '20 parts streamed to staging via pre-signed URLs' });
  }

  /** ---- Platform admin: tenant user directory (demo) ---- */
  readonly platformUsers = signal([
    { email: 'a.sharma@alpha.bank', name: 'A. Sharma', role: 'DATA_STEWARD', active: true,  lastSeen: '2026-07-19 14:02 UTC' },
    { email: 'm.boyd@alpha.bank',   name: 'M. Boyd',   role: 'APPROVER',     active: true,  lastSeen: '2026-07-18 09:41 UTC' },
    { email: 'r.chen@alpha.bank',   name: 'R. Chen',   role: 'ANALYST',      active: true,  lastSeen: '2026-07-17 16:20 UTC' },
    { email: 'j.crawford@alpha.bank', name: 'J. Crawford', role: 'DATA_STEWARD', active: true, lastSeen: '2026-07-11 15:05 UTC' },
    { email: 'ingest-svc@alpha.bank', name: 'ingest-svc', role: 'DATA_STEWARD', active: true, lastSeen: '2026-07-14 06:12 UTC' },
    { email: 'p.osei@alpha.bank',   name: 'P. Osei',   role: 'ANALYST',      active: false, lastSeen: '2026-05-02 11:00 UTC' }
  ]);

  toggleUserActive(email: string) {
    this.platformUsers.update(list =>
      list.map(u => u.email === email ? { ...u, active: !u.active } : u));
  }

  /** ---- Dashboard stats ---- */
  readonly stats = computed(() => {
    const ds = this.datasets();
    return {
      inReview: ds.filter(d => d.status === 'IN_REVIEW').length,
      pending: ds.filter(d => d.status === 'PENDING_APPROVAL').length,
      published: ds.filter(d => d.status === 'PUBLISHED').length,
      flagged: ds.reduce((n, d) => n + d.flaggedCount, 0),
      records: ds.reduce((n, d) => n + d.recordCount, 0)
    };
  });

  /** Uploads per weekday for the dashboard chart (demo series + live additions). */
  readonly uploadTrend = computed(() => {
    const base = [2, 4, 1, 3, 5, 2, 1];
    const extra = Math.max(0, this.datasets().length - 3);
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
      day, count: base[i] + (i === 5 ? extra : 0)
    }));
  });

  datasetById(id: string) { return this.datasets().find(d => d.id === id); }
}
