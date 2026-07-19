package com.datasteward.hub.repo;

import com.datasteward.hub.model.DataRecordRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DataRecordRepository extends JpaRepository<DataRecordRow, String> {
    Page<DataRecordRow> findByDatasetId(String datasetId, Pageable pageable);
}
