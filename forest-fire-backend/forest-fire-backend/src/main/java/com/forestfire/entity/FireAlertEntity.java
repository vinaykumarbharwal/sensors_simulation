package com.forestfire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "fire_alerts", indexes = {
        @Index(name = "idx_alert_zone_timestamp", columnList = "zone, timestamp")
})
public class FireAlertEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 96)
    private String alertId;

    @Column(nullable = false, length = 64)
    private String zone;

    @Column(nullable = false, length = 24)
    private String alertLevel;

    @Column(nullable = false, length = 600)
    private String message;

    @Column(nullable = false)
    private int fireChancePercent;

    @Column(nullable = false, length = 600)
    private String triggeredSensors;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private boolean resolved;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAlertId() { return alertId; }
    public void setAlertId(String alertId) { this.alertId = alertId; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getAlertLevel() { return alertLevel; }
    public void setAlertLevel(String alertLevel) { this.alertLevel = alertLevel; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getFireChancePercent() { return fireChancePercent; }
    public void setFireChancePercent(int fireChancePercent) { this.fireChancePercent = fireChancePercent; }

    public String getTriggeredSensors() { return triggeredSensors; }
    public void setTriggeredSensors(String triggeredSensors) { this.triggeredSensors = triggeredSensors; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
}
