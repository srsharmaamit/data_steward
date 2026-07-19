package com.datasteward.hub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "staged_records", indexes = @Index(columnList = "datasetId"))
public class DataRecordRow {

    @Id
    private String id;                 // e.g. R-0001 (scoped to dataset)
    private String datasetId;

    @Column(columnDefinition = "jsonb")
    private String valuesJson;         // current field values

    @Column(columnDefinition = "jsonb")
    private String flagsJson;          // validation flags per field

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDatasetId() { return datasetId; }
    public void setDatasetId(String datasetId) { this.datasetId = datasetId; }
    public String getValuesJson() { return valuesJson; }
    public void setValuesJson(String valuesJson) { this.valuesJson = valuesJson; }
    public String getFlagsJson() { return flagsJson; }
    public void setFlagsJson(String flagsJson) { this.flagsJson = flagsJson; }
}
