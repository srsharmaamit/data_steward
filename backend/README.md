# DataSteward Hub — Spring Boot API

Backend for the multi-tenant data adjustment & review platform. Deploy one instance
per tenant namespace on Kubernetes (Vercel cannot host JVM apps — it serves the Angular UI only).

## Endpoints
- `GET  /api/datasets` — staging queue
- `GET  /api/datasets/{id}/records?page=&size=` — paged records (never whole multi-GB sets)
- `POST /api/datasets/{id}/edits` — field correction (role: DATA_STEWARD, audited)
- `POST /api/datasets/{id}/submit` — lock for approval (DATA_STEWARD)
- `POST /api/datasets/{id}/approve` — two-person rule enforced; publishes Iceberg snapshot (APPROVER)
- `POST /api/datasets/{id}/reject` — return to steward (APPROVER)
- `GET  /api/datasets/{id}/audit` — append-only audit ledger

## Run locally
```
export STAGING_DB_HOST=localhost STAGING_DB_PASSWORD=... OIDC_ISSUER_URI=<your realm>
mvn spring-boot:run
```

## Wire the Angular UI
Set `UI_ORIGIN` to your Vercel URL (CORS), then in the frontend set `API_URL`
in `src/app/data.service.ts` and swap the in-memory mutations for HttpClient calls —
the TypeScript models already match this API's JSON shapes.

## Iceberg publish
`IcebergPublisher` is a stub returning a fake snapshot id so the workflow runs end-to-end.
Uncomment the iceberg deps in `pom.xml` and follow the class javadoc to commit real
Parquet snapshots via a REST/Nessie catalog with per-tenant credential vending.
