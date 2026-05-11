package com.forestfire.dao;

import com.forestfire.entity.FireAlertEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FireAlertRepository extends JpaRepository<FireAlertEntity, Long> {
    Optional<FireAlertEntity> findByAlertId(String alertId);

    List<FireAlertEntity> findAllByOrderByTimestampDesc(Pageable pageable);

    List<FireAlertEntity> findByZoneIgnoreCaseOrderByTimestampDesc(String zone, Pageable pageable);
}
