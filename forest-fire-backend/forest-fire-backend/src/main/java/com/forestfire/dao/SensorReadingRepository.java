package com.forestfire.dao;

import com.forestfire.entity.SensorReadingEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SensorReadingRepository extends JpaRepository<SensorReadingEntity, Long> {
	List<SensorReadingEntity> findByTimestampAfterOrderByTimestampDesc(LocalDateTime cutoff, Pageable pageable);

	List<SensorReadingEntity> findBySensor_Zone_NameIgnoreCaseAndTimestampAfterOrderByTimestampDesc(
			String zoneName, LocalDateTime cutoff, Pageable pageable
	);

	long deleteByTimestampBefore(LocalDateTime cutoff);
}
