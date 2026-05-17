package com.forestfire.model;

import java.util.List;

public class AdminOutpostRequest {

    private String outpostName;
    private String zoneName;
    private double latitude;
    private double longitude;
    private int employeeCount;
    private String createdByRole;
    private String operationalRole;
    private double coverageRadiusKm;
    private List<String> equipment;
    private String employeeUsername;
    private String employeePassword;

    public String getOutpostName() { return outpostName; }
    public void setOutpostName(String outpostName) { this.outpostName = outpostName; }

    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }

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

    public List<String> getEquipment() { return equipment; }
    public void setEquipment(List<String> equipment) { this.equipment = equipment; }

    public String getEmployeeUsername() { return employeeUsername; }
    public void setEmployeeUsername(String employeeUsername) { this.employeeUsername = employeeUsername; }

    public String getEmployeePassword() { return employeePassword; }
    public void setEmployeePassword(String employeePassword) { this.employeePassword = employeePassword; }
}