package com.datasteward.hub.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Append-only audit ledger. No update/delete endpoints exist for this table;
 * grant the app role INSERT+SELECT only, and consider WORM/object-lock export
 * for long-term regulatory retention.
 */
@Entity
@Table(name = "audit_events", indexes = @Index(columnList = "datasetId"))
public class AuditEvent {

    public enum Action { UPLOAD, EDIT, SUBMIT, APPROVE, REJECT, PUBLISH, PII_REVEAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Instant at = Instant.now();
    private String actor;
    private String role;

    @Enumerated(EnumType.STRING)
    private Action action;

    private String datasetId;
    private String recordId;
    private String field;

    @Column(columnDefinition = "text")
    private String oldValue;           // for PII-tagged fields store a vault reference, not plaintext

    @Column(columnDefinition = "text")
    private String newValue;

    @Column(columnDefinition = "text")
    private String note;

    public Long getId() { return id; }
    public Instant getAt() { return at; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Action getAction() { return action; }
    public void setAction(Action action) { this.action = action; }
    public String getDatasetId() { return datasetId; }
    public void setDatasetId(String datasetId) { this.datasetId = datasetId; }
    public String getRecordId() { return recordId; }
    public void setRecordId(String recordId) { this.recordId = recordId; }
    public String getField() { return field; }
    public void setField(String field) { this.field = field; }
    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }
    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
