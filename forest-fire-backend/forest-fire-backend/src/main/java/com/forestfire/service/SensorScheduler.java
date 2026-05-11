package com.forestfire.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled task that triggers sensor simulation at regular intervals.
 */
@Component
public class SensorScheduler {

    @Autowired
    private SensorSimulationService simulationService;

    /**
     * Run simulation every 20 seconds to reduce database growth.
     */
    @Scheduled(fixedRate = 20000)
    public void runSimulation() {
        simulationService.simulateAll();
    }
}
