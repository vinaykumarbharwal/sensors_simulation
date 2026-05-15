package com.forestfire.model;

import java.time.LocalDateTime;

public class ForestMapSensor {

    private String sensorId;
    private String sensorType;
    private String model;
    private String zone;
    private String location;
    private double latitude;
    private double longitude;
    private double value;
    private String unit;
    private String status;
    private LocalDateTime timestamp;
    private double dangerThreshold;
    private double coverageRadiusKm;
    private String createdByRole;
    private String createdByUsername;

    public ForestMapSensor() {}

    public ForestMapSensor(String sensorId, String sensorType, String model, String zone, String location,
                           double latitude, double longitude, double value, String unit,
                           String status, LocalDateTime timestamp, double dangerThreshold,
                           double coverageRadiusKm, String createdByRole, String createdByUsername) {
        this.sensorId = sensorId;
        this.sensorType = sensorType;
        this.model = model;
        this.zone = zone;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.value = value;
        this.unit = unit;
        this.status = status;
        this.timestamp = timestamp;
        this.dangerThreshold = dangerThreshold;
        this.coverageRadiusKm = coverageRadiusKm;
        this.createdByRole = createdByRole;
        this.createdByUsername = createdByUsername;
    }

    public String getSensorId() { return sensorId; }
    public void setSensorId(String sensorId) { this.sensorId = sensorId; }

    public String getSensorType() { return sensorType; }
    public void setSensorType(String sensorType) { this.sensorType = sensorType; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

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

    public double getCoverageRadiusKm() { return coverageRadiusKm; }
    public void setCoverageRadiusKm(double coverageRadiusKm) { this.coverageRadiusKm = coverageRadiusKm; }

    public String getCreatedByRole() { return createdByRole; }
    public void setCreatedByRole(String createdByRole) { this.createdByRole = createdByRole; }

    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }
}