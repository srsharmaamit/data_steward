package com.datasteward.hub.service;

import com.datasteward.hub.model.AuditEvent;
import com.datasteward.hub.model.DataRecordRow;
import com.datasteward.hub.model.Dataset;
import com.datasteward.hub.repo.AuditEventRepository;
import com.datasteward.hub.repo.DataRecordRepository;
import com.datasteward.hub.repo.DatasetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Workflow state machine: IN_REVIEW -> PENDING_APPROVAL -> PUBLISHED (or back to IN_REVIEW on reject).
 * Enforces the two-person rule: the approver must differ from the last submitter.
 */
@Service
public class DatasetService {

    private final DatasetRepository datasets;
    private final DataRecordRepository records;
    private final AuditEventRepository audit;
    private final IcebergPublisher publisher;

    public DatasetService(DatasetRepository datasets, DataRecordRepository records,
                          AuditEventRepository audit, IcebergPublisher publisher) {
        this.datasets = datasets;
        this.records = records;
        this.audit = audit;
        this.publisher = publisher;
    }

    public Dataset get(String id) {
        return datasets.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dataset not found"));
    }

    @Transactional
    public void editCell(String datasetId, String recordId, String field,
                         String oldValue, String newValue, String actor, String role) {
        Dataset ds = get(datasetId);
        if (ds.getStatus() != Dataset.Status.IN_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dataset is locked for review");
        }
        DataRecordRow row = records.findById(recordId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        // NOTE: apply the field mutation to row.valuesJson here (jsonb_set via native query,
        // or deserialize/serialize with Jackson). Kept explicit for the reader.
        records.save(row);
        log(actor, role, AuditEvent.Action.EDIT, datasetId, recordId, field, oldValue, newValue, null);
    }

    @Transactional
    public void submit(String datasetId, String actor, String role) {
        Dataset ds = get(datasetId);
        if (ds.getStatus() != Dataset.Status.IN_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only IN_REVIEW datasets can be submitted");
        }
        ds.setStatus(Dataset.Status.PENDING_APPROVAL);
        datasets.save(ds);
        log(actor, role, AuditEvent.Action.SUBMIT, datasetId, null, null, null, null,
            "Dataset locked for second-person review");
    }

    @Transactional
    public void approve(String datasetId, String actor, String role) {
        Dataset ds = get(datasetId);
        if (ds.getStatus() != Dataset.Status.PENDING_APPROVAL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dataset is not pending approval");
        }
        // Two-person rule: block self-approval.
        boolean selfApproval = audit.findByDatasetIdOrderByAtDesc(datasetId).stream()
            .filter(e -> e.getAction() == AuditEvent.Action.SUBMIT)
            .findFirst()
            .map(e -> e.getActor().equals(actor))
            .orElse(false);
        if (selfApproval) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Submitter cannot approve their own dataset");
        }
        log(actor, role, AuditEvent.Action.APPROVE, datasetId, null, null, null, null, null);

        String snapshotId = publisher.publish(ds);
        ds.setSnapshotId(snapshotId);
        ds.setStatus(Dataset.Status.PUBLISHED);
        datasets.save(ds);
        log("system", role, AuditEvent.Action.PUBLISH, datasetId, null, null, null, null,
            "Iceberg snapshot " + snapshotId + " committed");
    }

    @Transactional
    public void reject(String datasetId, String actor, String role, String reason) {
        Dataset ds = get(datasetId);
        if (ds.getStatus() != Dataset.Status.PENDING_APPROVAL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dataset is not pending approval");
        }
        ds.setStatus(Dataset.Status.IN_REVIEW);
        datasets.save(ds);
        log(actor, role, AuditEvent.Action.REJECT, datasetId, null, null, null, null, reason);
    }

    private void log(String actor, String role, AuditEvent.Action action, String datasetId,
                     String recordId, String field, String oldValue, String newValue, String note) {
        AuditEvent e = new AuditEvent();
        e.setActor(actor);
        e.setRole(role);
        e.setAction(action);
        e.setDatasetId(datasetId);
        e.setRecordId(recordId);
        e.setField(field);
        e.setOldValue(oldValue);
        e.setNewValue(newValue);
        e.setNote(note);
        audit.save(e);
    }
}
