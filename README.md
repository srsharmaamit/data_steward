# DataSteward Hub

Multi-tenant data adjustment & review platform.

- **Root**: Angular 18 UI (deployed on Vercel). Demo data layer in `src/app/data.service.ts` — set `API_URL` to wire the real backend.
- **`backend/`**: Spring Boot 3.3 REST API (JWT/RBAC, two-person approval, append-only audit, Iceberg publish stub). Deploy on Kubernetes — see `backend/README.md` and `backend/k8s/`.

## Run with Docker (UBI8)

Two-stage build on Red Hat Universal Base Images: `ubi8/nodejs-20` compiles the
Angular bundle, `ubi8/nginx-122` serves it as a non-root container on port 8080.

```bash
# Build and run
docker compose up --build -d
# then open http://localhost:8080

# or without compose:
docker build -t stewarddata-hub .
docker run -d -p 8080:8080 --name stewarddata-hub stewarddata-hub
```

The runtime container makes no external calls — fonts, icons, and data layer
are all bundled. App state persists in the browser's localStorage.
