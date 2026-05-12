package com.forestfire.model;

import java.time.LocalDateTime;

/**
 * Represents a single sensor reading snapshot.
 */
public class SensorReading {

    private String sensorId;
    private String sensorType;
    private String zone;
    private String location;
    private double value;
    private String unit;
    private String status; // SAFE, WARNING, DANGER
    private LocalDateTime timestamp;
    private double dangerThreshold;

    public SensorReading() {}

    public SensorReading(String sensorId, String sensorType, String zone,
                         String location, double value, String unit,
                         String status, LocalDateTime timestamp, double dangerThreshold) {
        this.sensorId = sensorId;
        this.sensorType = sensorType;
        this.zone = zone;
        this.location = location;
        this.value = value;
        this.unit = unit;
        this.status = status;
        this.timestamp = timestamp;
        this.dangerThreshold = dangerThreshold;
    }

    // Getters and setters
    public String getSensorId() { return sensorId; }
    public void setSensorId(String sensorId) { this.sensorId = sensorId; }

    public String getSensorType() { return sensorType; }
    public void setSensorType(String sensorType) { this.sensorType = sensorType; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public double getValue() { return value; }
    public void setValue(double value) { this.value = value; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public double getDangerThreshold() { return dangerThreshold; }
    public void setDangerThreshold(double dangerThreshold) { this.dangerThreshold = dangerThreshold; }
}
