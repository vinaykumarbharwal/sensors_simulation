package com.forestfire.model;

import java.time.LocalDateTime;

public class EquipmentUsageResponse {

    private String outpostId;
    private String equipmentName;
    private String employeeId;
    private String purpose;
    private String status;
    private LocalDateTime usedAt;

    public EquipmentUsageResponse() {
    }

    public EquipmentUsageResponse(String outpostId, String equipmentName, String employeeId, String purpose,
                                  String status, LocalDateTime usedAt) {
        this.outpostId = outpostId;
        this.equipmentName = equipmentName;
        this.employeeId = employeeId;
        this.purpose = purpose;
        this.status = status;
        this.usedAt = usedAt;
    }

    public String getOutpostId() { return outpostId; }
    public void setOutpostId(String outpostId) { this.outpostId = outpostId; }

    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String equipmentName) { this.equipmentName = equipmentName; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getUsedAt() { return usedAt; }
    public void setUsedAt(LocalDateTime usedAt) { this.usedAt = usedAt; }
}