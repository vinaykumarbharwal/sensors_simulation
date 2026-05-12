package com.forestfire.dao;

import com.forestfire.entity.ForestOutpostEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OutpostRepository extends JpaRepository<ForestOutpostEntity, Long> {
    Optional<ForestOutpostEntity> findByZoneNameIgnoreCase(String zoneName);
    Optional<ForestOutpostEntity> findByOutpostId(String outpostId);
}