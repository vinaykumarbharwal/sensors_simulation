package com.forestfire.model;

public class AdminSensorRequest {

    private String zoneName;
    private String sensorType;
    private String model;
    private String location;
    private double latitude;
    private double longitude;
    private double coverageRadiusKm;
    private String createdByRole;

    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }

    public String getSensorType() { return sensorType; }
    public void setSensorType(String sensorType) { this.sensorType = sensorType; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public double getCoverageRadiusKm() { return coverageRadiusKm; }
    public void setCoverageRadiusKm(double coverageRadiusKm) { this.coverageRadiusKm = coverageRadiusKm; }

    public String getCreatedByRole() { return createdByRole; }
    public void setCreatedByRole(String createdByRole) { this.createdByRole = createdByRole; }
}