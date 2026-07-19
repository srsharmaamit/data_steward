package com.datasteward.hub.repo;

import com.datasteward.hub.model.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    List<AuditEvent> findByDatasetIdOrderByAtDesc(String datasetId);
}
