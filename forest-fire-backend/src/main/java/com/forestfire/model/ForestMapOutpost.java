package com.forestfire.model;

import java.util.List;

public class ForestMapOutpost {

    private String outpostId;
    private String outpostName;
    private String zone;
    private double latitude;
    private double longitude;
    private int employeeCount;
    private String createdByRole;
    private String operationalRole;
    private double coverageRadiusKm;
    private List<String> availableEquipment;

    public ForestMapOutpost() {}

    public ForestMapOutpost(String outpostId, String outpostName, String zone, double latitude, double longitude,
                            int employeeCount, String createdByRole, String operationalRole,
                            double coverageRadiusKm, List<String> availableEquipment) {
        this.outpostId = outpostId;
        this.outpostName = outpostName;
        this.zone = zone;
        this.latitude = latitude;
        this.longitude = longitude;
        this.employeeCount = employeeCount;
        this.createdByRole = createdByRole;
        this.operationalRole = operationalRole;
        this.coverageRadiusKm = coverageRadiusKm;
        this.availableEquipment = availableEquipment;
    }

    public String getOutpostId() { return outpostId; }
    public void setOutpostId(String outpostId) { this.outpostId = outpostId; }

    public String getOutpostName() { return outpostName; }
    public void setOutpostName(String outpostName) { this.outpostName = outpostName; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public int getEmployeeCount() { return employeeCount; }
    public void setEmployeeCount(int employeeCount) { this.employeeCount = employeeCount; }

    public String getCreatedByRole() { return createdByRole; }
    public void setCreatedByRole(String createdByRole) { this.createdByRole = createdByRole; }

    public String getOperationalRole() { return operationalRole; }
    public void setOperationalRole(String operationalRole) { this.operationalRole = operationalRole; }

    public double getCoverageRadiusKm() { return coverageRadiusKm; }
    public void setCoverageRadiusKm(double coverageRadiusKm) { this.coverageRadiusKm = coverageRadiusKm; }

    public List<String> getAvailableEquipment() { return availableEquipment; }
    public void setAvailableEquipment(List<String> availableEquipment) { this.availableEquipment = availableEquipment; }
}