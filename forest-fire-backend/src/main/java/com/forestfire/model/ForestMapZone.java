package com.forestfire.model;

import java.util.List;

public class ForestMapZone {

    private String zoneName;
    private String state;
    private String description;
    private double latitude;
    private double longitude;
    private String overallStatus;
    private int fireChancePercent;
    private boolean hasActiveAlert;
    private List<ForestMapSensor> sensors;
    private ForestMapOutpost outpost;
    private ForestMapResponsePlan responsePlan;

    public ForestMapZone() {}

    public ForestMapZone(String zoneName, String state, String description, double latitude, double longitude,
                         String overallStatus, int fireChancePercent, boolean hasActiveAlert,
                         List<ForestMapSensor> sensors, ForestMapOutpost outpost,
                         ForestMapResponsePlan responsePlan) {
        this.zoneName = zoneName;
        this.state = state;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.overallStatus = overallStatus;
        this.fireChancePercent = fireChancePercent;
        this.hasActiveAlert = hasActiveAlert;
        this.sensors = sensors;
        this.outpost = outpost;
        this.responsePlan = responsePlan;
    }

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

    public String getOverallStatus() { return overallStatus; }
    public void setOverallStatus(String overallStatus) { this.overallStatus = overallStatus; }

    public int getFireChancePercent() { return fireChancePercent; }
    public void setFireChancePercent(int fireChancePercent) { this.fireChancePercent = fireChancePercent; }

    public boolean isHasActiveAlert() { return hasActiveAlert; }
    public void setHasActiveAlert(boolean hasActiveAlert) { this.hasActiveAlert = hasActiveAlert; }

    public List<ForestMapSensor> getSensors() { return sensors; }
    public void setSensors(List<ForestMapSensor> sensors) { this.sensors = sensors; }

    public ForestMapOutpost getOutpost() { return outpost; }
    public void setOutpost(ForestMapOutpost outpost) { this.outpost = outpost; }

    public ForestMapResponsePlan getResponsePlan() { return responsePlan; }
    public void setResponsePlan(ForestMapResponsePlan responsePlan) { this.responsePlan = responsePlan; }
}