package com.forestfire.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DataRetentionScheduler {

    private final SensorSimulationService simulationService;

    public DataRetentionScheduler(SensorSimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @Scheduled(cron = "${app.readings.retention-cron:0 0 2 * * *}")
    public void cleanupOldReadings() {
        simulationService.cleanupOldReadings();
    }
}
