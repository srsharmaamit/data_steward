package com.datasteward.hub.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "datasets")
public class Dataset {

    public enum Status { IN_REVIEW, PENDING_APPROVAL, PUBLISHED, REJECTED }

    @Id
    private String id;                 // e.g. DS-2026-0714
    private String name;
    private String source;
    private long sizeBytes;
    private String uploadedBy;
    private Instant uploadedAt;

    @Enumerated(EnumType.STRING)
    private Status status = Status.IN_REVIEW;

    private String snapshotId;         // Iceberg snapshot once published

    @Column(columnDefinition = "text")
    private String columnMetadataJson; // schema + PII tags, drives masking policy in UI and API

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getSnapshotId() { return snapshotId; }
    public void setSnapshotId(String snapshotId) { this.snapshotId = snapshotId; }
    public String getColumnMetadataJson() { return columnMetadataJson; }
    public void setColumnMetadataJson(String s) { this.columnMetadataJson = s; }
}
