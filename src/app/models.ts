/** Domain contract — mirrors the Spring Boot API (see backend/src/main/java/com/datasteward/hub). */

export type DatasetStatus = 'IN_REVIEW' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';

export type Role = 'DATA_STEWARD' | 'APPROVER' | 'ANALYST';

export interface ColumnDef {
  key: string;
  label: string;
  pii: boolean;          // masked unless the user's role carries PII_ACCESS
  editable: boolean;
  type: 'text' | 'number';
}

export interface DataRecord {
  id: string;
  values: { [key: string]: string };
  flags: { [key: string]: string };     // validation flags per column, e.g. "IBAN checksum failed"
  edited: { [key: string]: string };    // original values for cells changed this session
}

export interface Dataset {
  id: string;
  name: string;
  source: string;
  sizeLabel: string;
  uploadedBy: string;
  uploadedAt: string;
  status: DatasetStatus;
  recordCount: number;
  flaggedCount: number;
  snapshotId?: string;                  // Iceberg snapshot once published
  columns: ColumnDef[];
  records: DataRecord[];
}

export interface AuditEvent {
  id: number;
  at: string;
  actor: string;
  role: Role;
  action: 'UPLOAD' | 'EDIT' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'PUBLISH' | 'PII_REVEAL';
  datasetId: string;
  recordId?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
}

export interface UserContext {
  name: string;
  role: Role;
  tenant: string;
  piiAccess: boolean;
}
