package com.forestfire.dao;

import com.forestfire.entity.SensorReadingEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReadingEntity, Long> {

    @Query("SELECT r FROM SensorReadingEntity r JOIN FETCH r.sensor s JOIN FETCH s.zone z WHERE r.timestamp > :cutoff ORDER BY r.timestamp DESC")
    List<SensorReadingEntity> findRecentWithDetails(@Param("cutoff") LocalDateTime cutoff, Pageable pageable);

    @Query("SELECT r FROM SensorReadingEntity r JOIN FETCH r.sensor s JOIN FETCH s.zone z WHERE LOWER(z.name) = LOWER(:zoneName) AND r.timestamp > :cutoff ORDER BY r.timestamp DESC")
    List<SensorReadingEntity> findRecentByZoneWithDetails(@Param("zoneName") String zoneName, @Param("cutoff") LocalDateTime cutoff, Pageable pageable);

    long deleteByTimestampBefore(LocalDateTime cutoff);

    void deleteBySensor(com.forestfire.entity.SensorEntity sensor);
}
