# DataSteward Hub

Multi-tenant data adjustment & review platform.

- **Root**: Angular 18 UI (deployed on Vercel). Demo data layer in `src/app/data.service.ts` — set `API_URL` to wire the real backend.
- **`backend/`**: Spring Boot 3.3 REST API (JWT/RBAC, two-person approval, append-only audit, Iceberg publish stub). Deploy on Kubernetes — see `backend/README.md` and `backend/k8s/`.
