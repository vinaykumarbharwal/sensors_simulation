package com.forestfire.model;

public class ForestMapResponsePlan {

    private String nearestOutpostName;
    private String nearestOutpostZone;
    private double distanceKm;
    private double predictedImpactRadiusKm;
    private double predictedImpactAreaSqKm;
    private String responseMode;
    private int manpowerRequired;
    private int uavCount;
    private int etaMinutes;
    private String summary;

    public ForestMapResponsePlan() {}

    public ForestMapResponsePlan(String nearestOutpostName, String nearestOutpostZone, double distanceKm,
                                 double predictedImpactRadiusKm, double predictedImpactAreaSqKm, String responseMode,
                                 int manpowerRequired, int uavCount, int etaMinutes, String summary) {
        this.nearestOutpostName = nearestOutpostName;
        this.nearestOutpostZone = nearestOutpostZone;
        this.distanceKm = distanceKm;
        this.predictedImpactRadiusKm = predictedImpactRadiusKm;
        this.predictedImpactAreaSqKm = predictedImpactAreaSqKm;
        this.responseMode = responseMode;
        this.manpowerRequired = manpowerRequired;
        this.uavCount = uavCount;
        this.etaMinutes = etaMinutes;
        this.summary = summary;
    }

    public String getNearestOutpostName() { return nearestOutpostName; }
    public void setNearestOutpostName(String nearestOutpostName) { this.nearestOutpostName = nearestOutpostName; }

    public String getNearestOutpostZone() { return nearestOutpostZone; }
    public void setNearestOutpostZone(String nearestOutpostZone) { this.nearestOutpostZone = nearestOutpostZone; }

    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    public double getPredictedImpactRadiusKm() { return predictedImpactRadiusKm; }
    public void setPredictedImpactRadiusKm(double predictedImpactRadiusKm) { this.predictedImpactRadiusKm = predictedImpactRadiusKm; }

    public double getPredictedImpactAreaSqKm() { return predictedImpactAreaSqKm; }
    public void setPredictedImpactAreaSqKm(double predictedImpactAreaSqKm) { this.predictedImpactAreaSqKm = predictedImpactAreaSqKm; }

    public String getResponseMode() { return responseMode; }
    public void setResponseMode(String responseMode) { this.responseMode = responseMode; }

    public int getManpowerRequired() { return manpowerRequired; }
    public void setManpowerRequired(int manpowerRequired) { this.manpowerRequired = manpowerRequired; }

    public int getUavCount() { return uavCount; }
    public void setUavCount(int uavCount) { this.uavCount = uavCount; }

    public int getEtaMinutes() { return etaMinutes; }
    public void setEtaMinutes(int etaMinutes) { this.etaMinutes = etaMinutes; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
}