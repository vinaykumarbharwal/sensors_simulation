package com.forestfire.sensor;

import java.time.LocalDateTime;
import java.util.Random;

/**
 * Abstract base class for all forest fire detection sensors.
 * Each sensor monitors a specific zone and provides readings.
 */
public abstract class Sensor {

    protected String sensorId;
    protected String zone;
    protected String location;
    protected boolean active;
    protected LocalDateTime lastUpdated;
    protected Random random;

    public Sensor(String sensorId, String zone, String location) {
        this.sensorId = sensorId;
        this.zone = zone;
        this.location = location;
        this.active = true;
        this.random = new Random();
        this.lastUpdated = LocalDateTime.now();
    }

    /**
     * Simulate a sensor reading — each subclass implements its own logic.
     */
    public abstract double simulate();

    /**
     * Returns the unit of measurement for this sensor type.
     */
    public abstract String getUnit();

    /**
     * Returns the sensor type name.
     */
    public abstract String getSensorType();

    /**
     * Returns the sensor hardware model used for the simulated deployment.
     */
    public abstract String getModel();

    /**
     * Returns the approximate coverage radius in kilometers.
     */
    public abstract double getCoverageRadiusKm();

    /**
     * Returns the role that would normally create or install this sensor.
     */
    public String getCreatedByRole() {
        return "Forest Department Employee";
    }

    /**
     * Returns the danger threshold for this sensor.
     */
    public abstract double getDangerThreshold();

    /**
     * Checks whether the current reading is in danger zone.
     */
    public boolean isDangerous(double value) {
        return value >= getDangerThreshold();
    }

    // Getters
    public String getSensorId() { return sensorId; }
    public String getZone() { return zone; }
    public String getLocation() { return location; }
    public boolean isActive() { return active; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }

    protected void updateTimestamp() {
        this.lastUpdated = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return String.format("Sensor[%s | %s | Zone: %s | %s]",
                sensorId, getSensorType(), zone, location);
    }
}
