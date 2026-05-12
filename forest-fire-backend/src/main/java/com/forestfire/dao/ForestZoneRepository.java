package com.forestfire.dao;

import com.forestfire.entity.ForestZoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ForestZoneRepository extends JpaRepository<ForestZoneEntity, Long> {
    Optional<ForestZoneEntity> findByNameIgnoreCase(String name);
}
