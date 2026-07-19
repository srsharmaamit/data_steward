package com.datasteward.hub.service;

import com.datasteward.hub.model.Dataset;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Publishes an approved staging dataset to the lake as a new Iceberg snapshot.
 *
 * Production wiring (uncomment the iceberg deps in pom.xml):
 *   1. Build a RESTCatalog (or NessieCatalog) pointing at your catalog endpoint,
 *      with S3FileIO configured for the tenant's bucket/prefix and credentials
 *      vended per tenant (Vault / STS).
 *   2. Stream staged records to Parquet DataFiles (org.apache.iceberg.parquet.Parquet.writeData).
 *   3. table.newAppend().appendFile(dataFile)...commit()  — atomic snapshot commit.
 *   4. Return table.currentSnapshot().snapshotId().
 *
 * For a Postgres lake target, replace with batched upserts into the production schema.
 * Old snapshots stay queryable for audit/time-travel until an explicit expire-snapshots
 * maintenance job runs (respect your retention policy before expiring).
 */
@Component
public class IcebergPublisher {

    @Value("${datasteward.lake.iceberg-table}")
    private String tableName;

    public String publish(Dataset dataset) {
        // Placeholder: return a fake snapshot id so the workflow is testable end-to-end
        // before the lake wiring is in place.
        return String.valueOf(System.currentTimeMillis() * 1000 + dataset.getId().hashCode() % 1000);
    }
}
