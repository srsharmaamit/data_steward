package com.datasteward.hub.repo;

import com.datasteward.hub.model.Dataset;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DatasetRepository extends JpaRepository<Dataset, String> { }
