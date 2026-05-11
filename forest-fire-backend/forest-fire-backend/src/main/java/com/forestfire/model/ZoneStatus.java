package com.forestfire.model;

import java.util.List;

/**
 * Overall status of a forest zone — aggregates all sensor readings.
 */
public class ZoneStatus {

    private String zoneName;
    private String state;
    private String description;
    private double latitude;
    private double longitude;
    private List<SensorReading> sensorReadings;
    private String overallStatus;   // SAFE, WARNING, DANGER, CRITICAL
    private int fireChancePercent;
    private boolean hasActiveAlert;

    public ZoneStatus() {}

    public ZoneStatus(String zoneName, String state, String description, double latitude, double longitude) {
        this.zoneName = zoneName;
        this.state = state;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // Getters and setters
    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public List<SensorReading> getSensorReadings() { return sensorReadings; }
    public void setSensorReadings(List<SensorReading> sensorReadings) { this.sensorReadings = sensorReadings; }

    public String getOverallStatus() { return overallStatus; }
    public void setOverallStatus(String overallStatus) { this.overallStatus = overallStatus; }

    public int getFireChancePercent() { return fireChancePercent; }
    public void setFireChancePercent(int fireChancePercent) { this.fireChancePercent = fireChancePercent; }

    public boolean isHasActiveAlert() { return hasActiveAlert; }
    public void setHasActiveAlert(boolean hasActiveAlert) { this.hasActiveAlert = hasActiveAlert; }
}
