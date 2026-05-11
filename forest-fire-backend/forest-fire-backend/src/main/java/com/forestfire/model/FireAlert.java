package com.forestfire.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents a fire alert generated when sensors cross thresholds.
 */
public class FireAlert {

    public enum AlertLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    private String alertId;
    private String zone;
    private AlertLevel alertLevel;
    private String message;
    private int fireChancePercent;   // 0–100 estimated fire probability
    private List<String> triggeredSensors;
    private LocalDateTime timestamp;
    private boolean resolved;

    public FireAlert() {}

    public FireAlert(String alertId, String zone, AlertLevel alertLevel,
                     String message, int fireChancePercent,
                     List<String> triggeredSensors) {
        this.alertId = alertId;
        this.zone = zone;
        this.alertLevel = alertLevel;
        this.message = message;
        this.fireChancePercent = fireChancePercent;
        this.triggeredSensors = triggeredSensors;
        this.timestamp = LocalDateTime.now();
        this.resolved = false;
    }

    // Getters and setters
    public String getAlertId() { return alertId; }
    public void setAlertId(String alertId) { this.alertId = alertId; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public AlertLevel getAlertLevel() { return alertLevel; }
    public void setAlertLevel(AlertLevel alertLevel) { this.alertLevel = alertLevel; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getFireChancePercent() { return fireChancePercent; }
    public void setFireChancePercent(int fireChancePercent) { this.fireChancePercent = fireChancePercent; }

    public List<String> getTriggeredSensors() { return triggeredSensors; }
    public void setTriggeredSensors(List<String> triggeredSensors) { this.triggeredSensors = triggeredSensors; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
}
