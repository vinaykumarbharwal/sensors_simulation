package com.forestfire.dao;

import com.forestfire.entity.SensorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SensorRepository extends JpaRepository<SensorEntity, Long> {
    Optional<SensorEntity> findBySensorId(String sensorId);

    @Query("select s from SensorEntity s join fetch s.zone")
    List<SensorEntity> findAllWithZone();
}
