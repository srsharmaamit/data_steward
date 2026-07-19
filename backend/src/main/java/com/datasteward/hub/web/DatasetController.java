package com.datasteward.hub.web;

import com.datasteward.hub.model.AuditEvent;
import com.datasteward.hub.model.DataRecordRow;
import com.datasteward.hub.model.Dataset;
import com.datasteward.hub.repo.AuditEventRepository;
import com.datasteward.hub.repo.DataRecordRepository;
import com.datasteward.hub.repo.DatasetRepository;
import com.datasteward.hub.service.DatasetService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private final DatasetRepository datasets;
    private final DataRecordRepository records;
    private final AuditEventRepository audit;
    private final DatasetService service;

    public DatasetController(DatasetRepository datasets, DataRecordRepository records,
                             AuditEventRepository audit, DatasetService service) {
        this.datasets = datasets;
        this.records = records;
        this.audit = audit;
        this.service = service;
    }

    @GetMapping
    public List<Dataset> list() {
        return datasets.findAll();
    }

    @GetMapping("/{id}")
    public Dataset get(@PathVariable String id) {
        return service.get(id);
    }

    /** Paged access — the UI never loads a multi-GB dataset in one response. */
    @GetMapping("/{id}/records")
    public Page<DataRecordRow> recordPage(@PathVariable String id,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "100") int size) {
        return records.findByDatasetId(id, PageRequest.of(page, Math.min(size, 500)));
    }

    @GetMapping("/{id}/audit")
    public List<AuditEvent> auditTrail(@PathVariable String id) {
        return audit.findByDatasetIdOrderByAtDesc(id);
    }

    public record EditRequest(String recordId, String field, String oldValue, String newValue) {}

    @PostMapping("/{id}/edits")
    @PreAuthorize("hasRole('DATA_STEWARD')")
    public void edit(@PathVariable String id, @RequestBody EditRequest req,
                     @AuthenticationPrincipal Jwt jwt) {
        service.editCell(id, req.recordId(), req.field(), req.oldValue(), req.newValue(),
            jwt.getSubject(), primaryRole(jwt));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('DATA_STEWARD')")
    public void submit(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        service.submit(id, jwt.getSubject(), primaryRole(jwt));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('APPROVER')")
    public void approve(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        service.approve(id, jwt.getSubject(), primaryRole(jwt));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('APPROVER')")
    public void reject(@PathVariable String id, @RequestBody(required = false) Map<String, String> body,
                       @AuthenticationPrincipal Jwt jwt) {
        service.reject(id, jwt.getSubject(), primaryRole(jwt),
            body == null ? null : body.get("reason"));
    }

    private String primaryRole(Jwt jwt) {
        Object roles = jwt.getClaims().get("roles");
        return roles == null ? "UNKNOWN" : roles.toString();
    }
}
