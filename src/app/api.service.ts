import { Injectable } from '@angular/core';

/**
 * In-browser replica of the FastAPI backend (backend/server.py in the reference repo).
 * Same routes, same shapes (snake_case), same rules — persisted in localStorage so the
 * deployed app is fully functional without a server. Swap these methods for HttpClient
 * calls against the Spring Boot backend when you're ready.
 */

export interface ApiUser {
  id: string; email: string; name: string; role: 'admin' | 'data_steward' | 'approver';
  tenant_id: string | null; created_at: string;
}
export interface Tenant { id: string; name: string; description: string; created_at: string; }
export interface Dataset {
  id: string; tenant_id: string; name: string; description: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
  record_count: number; schema_config: { columns: string[] }; pii_fields: string[];
  created_by: string; created_at: string; published_at?: string;
}
export interface DataRecord {
  id: string; dataset_id: string; data: Record<string, string>;
  original_data: Record<string, string>; is_modified: boolean;
}
export interface Approval {
  id: string; dataset_id: string; dataset_name: string; tenant_id: string;
  status: 'pending' | 'approved' | 'rejected'; submitted_by: string; submitted_at: string;
  comments: string; reviewed_by?: string; reviewer_comments?: string; reviewed_at?: string;
}
export interface AuditLog {
  id: string; action: string; entity_type: string; entity_id: string;
  user_id: string; user_email: string; tenant_id: string;
  details: any; timestamp: string;
}
export interface Anomaly { record_index: number; field: string; issue: string; severity: 'high' | 'medium' | 'low'; }

const K = {
  users: 'dsh.users', creds: 'dsh.creds', sessions: 'dsh.sessions', tenants: 'dsh.tenants',
  datasets: 'dsh.datasets', records: 'dsh.records', approvals: 'dsh.approvals', audit: 'dsh.audit'
};

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() :
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }));
const now = () => new Date().toISOString();
const delay = (ms = 250) => new Promise(res => setTimeout(res, ms + Math.random() * 150));

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function save(key: string, value: any) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/** RFC-ish CSV parser: quoted fields, embedded commas/quotes/newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length > 0) { row.push(field); if (row.length > 1 || row[0] !== '') rows.push(row); }
  return rows;
}

class HttpError extends Error {
  constructor(public status: number, public detail: string) { super(detail); }
  get response() { return { data: { detail: this.detail } }; }
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private users = load<ApiUser[]>(K.users, []);
  private creds = load<Record<string, string>>(K.creds, {});
  private sessions = load<Record<string, string>>(K.sessions, {});
  private tenants = load<Tenant[]>(K.tenants, []);
  private datasets = load<Dataset[]>(K.datasets, []);
  private records = load<Record<string, DataRecord[]>>(K.records, {});
  private approvals = load<Approval[]>(K.approvals, []);
  private audit = load<AuditLog[]>(K.audit, []);

  private currentUser: ApiUser | null = null;

  private persist() {
    save(K.users, this.users); save(K.creds, this.creds); save(K.sessions, this.sessions);
    save(K.tenants, this.tenants); save(K.datasets, this.datasets); save(K.records, this.records);
    save(K.approvals, this.approvals); save(K.audit, this.audit);
  }

  setCurrentUser(u: ApiUser | null) { this.currentUser = u; }

  private me(): ApiUser {
    if (!this.currentUser) throw new HttpError(401, 'Not authenticated');
    return this.currentUser;
  }

  private log(action: string, entity_type: string, entity_id: string, details: any = null) {
    const u = this.me();
    this.audit.unshift({
      id: uuid(), action, entity_type, entity_id,
      user_id: u.id, user_email: u.email, tenant_id: u.tenant_id ?? 'system',
      details, timestamp: now()
    });
  }

  /** Only admins see unmasked PII — identical to backend mask_pii(). */
  private maskPii(data: Record<string, string>, piiFields: string[], role: string) {
    if (role === 'admin') return data;
    const masked = { ...data };
    for (const field of piiFields) {
      if (field in masked && masked[field]) {
        const value = String(masked[field]);
        masked[field] = value.length > 4
          ? value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2)
          : '****';
      }
    }
    return masked;
  }

  // ===================== AUTH =====================

  async register(email: string, password: string, name: string, role: ApiUser['role']) {
    await delay();
    email = email.trim().toLowerCase();
    if (this.users.some(u => u.email === email)) throw new HttpError(400, 'Email already registered');
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    const user: ApiUser = { id: uuid(), email, name, role, tenant_id: null, created_at: now() };
    this.users.push(user);
    this.creds[email] = btoa(password);
    const token = uuid();
    this.sessions[token] = user.id;
    this.currentUser = user;
    this.audit.unshift({
      id: uuid(), action: 'CREATE', entity_type: 'user', entity_id: user.id,
      user_id: user.id, user_email: user.email, tenant_id: 'system',
      details: { role }, timestamp: now()
    });
    this.persist();
    return { access_token: token, user };
  }

  async login(email: string, password: string) {
    await delay();
    email = email.trim().toLowerCase();
    const user = this.users.find(u => u.email === email);
    if (!user || this.creds[email] !== btoa(password)) throw new HttpError(401, 'Invalid email or password');
    const token = uuid();
    this.sessions[token] = user.id;
    this.currentUser = user;
    this.persist();
    return { access_token: token, user };
  }

  async fetchMe(token: string): Promise<ApiUser> {
    await delay(120);
    const uid = this.sessions[token];
    const user = this.users.find(u => u.id === uid);
    if (!user) throw new HttpError(401, 'Invalid token');
    this.currentUser = user;
    return user;
  }

  // ===================== TENANTS / USERS =====================

  async createTenant(name: string, description: string) {
    await delay();
    const u = this.me();
    if (u.role !== 'admin') throw new HttpError(403, 'Admin access required');
    const tenant: Tenant = { id: uuid(), name, description, created_at: now() };
    this.tenants.push(tenant);
    this.log('CREATE', 'tenant', tenant.id, { name });
    this.persist();
    return tenant;
  }

  async listTenants() { await delay(150); this.me(); return [...this.tenants]; }

  async listUsers() {
    await delay(150);
    if (this.me().role !== 'admin') throw new HttpError(403, 'Admin access required');
    return [...this.users];
  }

  async assignUserTenant(userId: string, tenantId: string) {
    await delay();
    if (this.me().role !== 'admin') throw new HttpError(403, 'Admin access required');
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new HttpError(404, 'User not found');
    user.tenant_id = tenantId;
    if (this.currentUser?.id === userId) this.currentUser = user;
    this.log('UPDATE_FIELD', 'user', userId, { tenant_id: tenantId });
    this.persist();
    return user;
  }

  // ===================== DATASETS =====================

  async createDataset(name: string, description: string): Promise<Dataset> {
    await delay();
    const u = this.me();
    if (!['admin', 'data_steward'].includes(u.role)) throw new HttpError(403, 'Insufficient permissions');
    if (!u.tenant_id) throw new HttpError(400, 'You must be assigned to a tenant to create datasets');
    const ds: Dataset = {
      id: uuid(), tenant_id: u.tenant_id, name, description, status: 'draft',
      record_count: 0, schema_config: { columns: [] }, pii_fields: [],
      created_by: u.id, created_at: now()
    };
    this.datasets.unshift(ds);
    this.log('CREATE', 'dataset', ds.id, { name });
    this.persist();
    return ds;
  }

  async uploadCsv(datasetId: string, file: File, piiFieldsRaw: string, onProgress?: (pct: number) => void) {
    const u = this.me();
    const ds = this.datasets.find(d => d.id === datasetId);
    if (!ds) throw new HttpError(404, 'Dataset not found');
    if (ds.tenant_id !== u.tenant_id && u.role !== 'admin') throw new HttpError(403, 'Access denied');

    const text = await file.text();
    // Simulated network progress so the Progress bar behaves like axios onUploadProgress
    for (let p = 10; p <= 90; p += 20) { onProgress?.(p); await delay(120); }

    const rows = parseCsv(text);
    if (rows.length < 2) throw new HttpError(400, 'CSV must have a header row and at least one data row');
    const columns = rows[0].map(c => c.trim());
    const piiList = piiFieldsRaw.split(',').map(f => f.trim()).filter(Boolean);

    const recs: DataRecord[] = rows.slice(1).map(r => {
      const data: Record<string, string> = {};
      columns.forEach((c, i) => data[c] = (r[i] ?? '').trim());
      return { id: uuid(), dataset_id: datasetId, data, original_data: { ...data }, is_modified: false };
    });

    this.records[datasetId] = recs;
    ds.record_count = recs.length;
    ds.schema_config = { columns };
    ds.pii_fields = piiList;
    this.log('UPLOAD', 'dataset', datasetId, { rows: recs.length, columns: columns.length, pii_fields: piiList });
    this.persist();
    onProgress?.(100);
    return { message: 'Uploaded', rows: recs.length, columns };
  }

  async listDatasets(status?: string): Promise<Dataset[]> {
    await delay(200);
    const u = this.me();
    let list = u.role === 'admin' ? [...this.datasets] : this.datasets.filter(d => d.tenant_id === u.tenant_id);
    if (status && status !== 'all') list = list.filter(d => d.status === status);
    return list;
  }

  async getDataset(id: string): Promise<Dataset> {
    await delay(150);
    const u = this.me();
    const ds = this.datasets.find(d => d.id === id);
    if (!ds) throw new HttpError(404, 'Dataset not found');
    if (ds.tenant_id !== u.tenant_id && u.role !== 'admin') throw new HttpError(403, 'Access denied');
    return { ...ds };
  }

  async deleteDataset(id: string) {
    await delay();
    const u = this.me();
    const ds = this.datasets.find(d => d.id === id);
    if (!ds) throw new HttpError(404, 'Dataset not found');
    if (!['admin', 'data_steward'].includes(u.role)) throw new HttpError(403, 'Insufficient permissions');
    this.datasets = this.datasets.filter(d => d.id !== id);
    delete this.records[id];
    this.approvals = this.approvals.filter(a => a.dataset_id !== id);
    this.log('DELETE', 'dataset', id, { name: ds.name });
    this.persist();
    return { message: 'Dataset deleted' };
  }

  async getRecords(datasetId: string, page: number, pageSize = 20) {
    await delay(200);
    const u = this.me();
    const ds = this.datasets.find(d => d.id === datasetId);
    if (!ds) throw new HttpError(404, 'Dataset not found');
    const all = this.records[datasetId] ?? [];
    const total = all.length;
    const total_pages = Math.max(1, Math.ceil(total / pageSize));
    const slice = all.slice((page - 1) * pageSize, page * pageSize);
    const out = slice.map(r => ({
      ...r,
      data: this.maskPii(r.data, ds.pii_fields, u.role),
      original_data: this.maskPii(r.original_data, ds.pii_fields, u.role)
    }));
    return { records: out, total, total_pages, page };
  }

  async patchRecord(datasetId: string, recordId: string, fieldUpdates: Record<string, string>) {
    await delay();
    const u = this.me();
    if (!['admin', 'data_steward'].includes(u.role)) throw new HttpError(403, 'Insufficient permissions');
    const ds = this.datasets.find(d => d.id === datasetId);
    if (!ds) throw new HttpError(404, 'Dataset not found');
    if (!['draft', 'rejected'].includes(ds.status)) throw new HttpError(400, 'Dataset is locked for editing');
    const rec = (this.records[datasetId] ?? []).find(r => r.id === recordId);
    if (!rec) throw new HttpError(404, 'Record not found');
    Object.assign(rec.data, fieldUpdates);
    rec.is_modified = true;
    this.log('UPDATE_FIELD', 'data_record', recordId, { dataset_id: datasetId, fields: Object.keys(fieldUpdates) });
    this.persist();
    return { message: 'Record updated' };
  }

  // ===================== APPROVALS =====================

  async submitApproval(datasetId: string, comments: string) {
    await delay();
    const u = this.me();
    const ds = this.datasets.find(d => d.id === datasetId);
    if (!ds) throw new HttpError(404, 'Dataset not found');
    if (!['draft', 'rejected'].includes(ds.status)) throw new HttpError(400, 'Dataset already submitted');
    const approval: Approval = {
      id: uuid(), dataset_id: datasetId, dataset_name: ds.name, tenant_id: ds.tenant_id,
      status: 'pending', submitted_by: u.id, submitted_at: now(), comments
    };
    this.approvals.unshift(approval);
    ds.status = 'pending_review';
    this.log('SUBMIT_APPROVAL', 'approval', approval.id, { dataset_id: datasetId, comments });
    this.persist();
    return approval;
  }

  async listApprovals(status?: string): Promise<Approval[]> {
    await delay(200);
    const u = this.me();
    let list = u.role === 'admin' ? [...this.approvals] : this.approvals.filter(a => a.tenant_id === u.tenant_id);
    if (status && status !== 'all') list = list.filter(a => a.status === status);
    return list;
  }

  async approvalAction(approvalId: string, action: 'approve' | 'reject', comments: string) {
    await delay();
    const u = this.me();
    if (!['admin', 'approver'].includes(u.role)) throw new HttpError(403, 'Insufficient permissions');
    const approval = this.approvals.find(a => a.id === approvalId);
    if (!approval) throw new HttpError(404, 'Approval not found');
    if (approval.status !== 'pending') throw new HttpError(400, 'Approval already processed');
    approval.status = action === 'approve' ? 'approved' : 'rejected';
    approval.reviewed_by = u.id;
    approval.reviewer_comments = comments;
    approval.reviewed_at = now();
    const ds = this.datasets.find(d => d.id === approval.dataset_id);
    if (ds) ds.status = action === 'approve' ? 'approved' : 'rejected';
    this.log(action === 'approve' ? 'APPROVAL_APPROVE' : 'APPROVAL_REJECT', 'approval', approvalId,
      { dataset_id: approval.dataset_id, comments });
    this.persist();
    return approval;
  }

  async publish(datasetId: string) {
    await delay(400);
    const u = this.me();
    if (!['admin', 'approver'].includes(u.role)) throw new HttpError(403, 'Insufficient permissions');
    const ds = this.datasets.find(d => d.id === datasetId);
    if (!ds) throw new HttpError(404, 'Dataset not found');
    if (ds.status !== 'approved') throw new HttpError(400, 'Dataset must be approved before publishing');
    ds.status = 'published';
    ds.published_at = now();
    this.log('PUBLISH', 'dataset', datasetId, {
      message: 'Dataset published to data lake (MOCKED)',
      s3_path: `s3://data-lake/${ds.tenant_id}/${ds.name.replace(/\s+/g, '_').toLowerCase()}/`
    });
    this.persist();
    return { message: 'Dataset published to data lake (MOCKED)' };
  }

  // ===================== AI ANALYSIS =====================

  async analyze(datasetId: string, sampleSize = 100) {
    await delay(900);
    const ds = this.datasets.find(d => d.id === datasetId);
    if (!ds) throw new HttpError(404, 'Dataset not found');
    const sample = (this.records[datasetId] ?? []).slice(0, sampleSize).map(r => r.data);
    if (sample.length === 0) throw new HttpError(400, 'No records to analyze');

    const columns = ds.schema_config.columns;
    const anomalies: Anomaly[] = [];
    const suggestions: string[] = [];

    for (const col of columns) {
      const values = sample.map(r => r[col] ?? '');
      const missing = values.filter(v => v === '').length;
      if (missing > 0) {
        anomalies.push({
          record_index: values.findIndex(v => v === ''), field: col,
          issue: `${missing} of ${values.length} sampled values are empty`,
          severity: missing / values.length > 0.2 ? 'high' : 'medium'
        });
        suggestions.push(`Backfill or default the ${missing} missing values in "${col}"`);
      }

      const nums = values.map(v => parseFloat(v.replace(/,/g, ''))).filter(n => !isNaN(n));
      if (nums.length >= Math.max(5, values.length * 0.8)) {
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const sd = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length) || 1;
        values.forEach((v, i) => {
          const n = parseFloat(v.replace(/,/g, ''));
          if (!isNaN(n) && Math.abs((n - mean) / sd) > 3 && anomalies.length < 12) {
            anomalies.push({ record_index: i, field: col, issue: `Value ${v} is a statistical outlier (>3σ from mean ${mean.toFixed(2)})`, severity: 'medium' });
          }
        });
      }

      if (/email/i.test(col)) {
        const bad = values.findIndex(v => v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
        if (bad >= 0) {
          anomalies.push({ record_index: bad, field: col, issue: `"${values[bad]}" is not a valid email address`, severity: 'high' });
          suggestions.push(`Validate email formats in "${col}" before publishing`);
        }
      }
    }

    const seen = new Set<string>(); let dupIdx = -1;
    sample.forEach((r, i) => {
      const key = JSON.stringify(r);
      if (seen.has(key) && dupIdx < 0) dupIdx = i;
      seen.add(key);
    });
    if (dupIdx >= 0) {
      anomalies.push({ record_index: dupIdx, field: columns[0] ?? 'row', issue: 'Exact duplicate of an earlier row detected', severity: 'medium' });
      suggestions.push('De-duplicate rows before publishing to the lake');
    }

    if (ds.pii_fields.length > 0) {
      suggestions.push(`Confirm masking policy covers all ${ds.pii_fields.length} PII field(s): ${ds.pii_fields.join(', ')}`);
    }
    if (suggestions.length === 0) suggestions.push('No corrective actions required — dataset looks publish-ready');

    const summary = anomalies.length === 0
      ? `Analyzed ${sample.length} records across ${columns.length} columns. No significant data quality issues detected.`
      : `Analyzed ${sample.length} records across ${columns.length} columns and found ${anomalies.length} potential issue(s), primarily in ${[...new Set(anomalies.map(a => a.field))].slice(0, 3).join(', ')}. Review flagged records before submitting for approval.`;

    this.log('AI_ANALYSIS', 'dataset', datasetId, { sample_size: sampleSize });
    this.persist();
    return { dataset_id: datasetId, anomalies: anomalies.slice(0, 12), suggestions: suggestions.slice(0, 6), summary };
  }

  // ===================== AUDIT / STATS =====================

  async auditLogs(page: number, pageSize = 50, entityType?: string, action?: string): Promise<AuditLog[]> {
    await delay(200);
    const u = this.me();
    let list = u.role === 'admin' ? [...this.audit] : this.audit.filter(l => l.tenant_id === (u.tenant_id ?? 'system'));
    if (entityType && entityType !== 'all') list = list.filter(l => l.entity_type === entityType);
    if (action && action !== 'all') list = list.filter(l => l.action === action);
    return list.slice((page - 1) * pageSize, page * pageSize);
  }

  async dashboardStats() {
    await delay(250);
    const u = this.me();
    const mine = u.role === 'admin' ? this.datasets : this.datasets.filter(d => d.tenant_id === u.tenant_id);
    const logs = u.role === 'admin' ? this.audit : this.audit.filter(l => l.tenant_id === (u.tenant_id ?? 'system'));
    return {
      total_datasets: mine.length,
      pending_reviews: mine.filter(d => d.status === 'pending_review').length,
      approved_datasets: mine.filter(d => d.status === 'approved').length,
      published_datasets: mine.filter(d => d.status === 'published').length,
      recent_activity: logs.slice(0, 10)
    };
  }
}
