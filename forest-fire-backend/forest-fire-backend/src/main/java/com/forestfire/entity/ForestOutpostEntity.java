package com.forestfire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "forest_outposts")
public class ForestOutpostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String outpostId;

    @Column(nullable = false, length = 128)
    private String outpostName;

    @Column(nullable = false, length = 64)
    private String zoneName;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(nullable = false)
    private int employeeCount;

    @Column(nullable = false, length = 64)
    private String createdByRole;

    @Column(nullable = false, length = 64)
    private String operationalRole;

    @Column(nullable = false)
    private double coverageRadiusKm;

    @Column(length = 1024)
    private String equipmentCsv = "";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOutpostId() { return outpostId; }
    public void setOutpostId(String outpostId) { this.outpostId = outpostId; }

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

    public String getEquipmentCsv() { return equipmentCsv; }
    public void setEquipmentCsv(String equipmentCsv) { this.equipmentCsv = equipmentCsv; }
}