package com.forestfire.controller;

import com.forestfire.model.FireAlert;
import com.forestfire.exception.ResourceNotFoundException;
import com.forestfire.model.ForestMapSnapshot;
import com.forestfire.model.SensorReading;
import com.forestfire.model.ZoneStatus;
import com.forestfire.service.SensorSimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API endpoints for the Forest Fire Detection System.
 *
 * Base path: /api/v1
 *
 * GET /api/v1/zones              — all zone statuses
 * GET /api/v1/zones/{name}       — specific zone
 * GET /api/v1/sensors/readings   — all sensor readings (grouped by zone)
 * GET /api/v1/alerts             — active fire alerts
 * GET /api/v1/alerts/zone/{name} — alerts for a specific zone
 * GET /api/v1/dashboard          — full dashboard snapshot
 */
@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")  // Allow frontend dev server
public class ForestFireController {

    @Autowired
    private SensorSimulationService simulationService;

    /**
     * Get status of all 3 forest zones.
     */
    @GetMapping("/zones")
    public ResponseEntity<List<ZoneStatus>> getAllZones() {
        return ResponseEntity.ok(simulationService.getAllZoneStatuses());
    }

    /**
     * Get status of a specific zone (kangra, baijnath, shahpur).
     */
    @GetMapping("/zones/{zoneName}")
    public ResponseEntity<?> getZone(@PathVariable String zoneName) {
        ZoneStatus zone = simulationService.getZoneStatus(zoneName);
        if (zone == null) {
            throw new ResourceNotFoundException("Zone not found: " + zoneName);
        }
        return ResponseEntity.ok(zone);
    }

    /**
     * Get all latest sensor readings grouped by zone.
     */
    @GetMapping("/sensors/readings")
    public ResponseEntity<Map<String, List<SensorReading>>> getAllReadings() {
        return ResponseEntity.ok(simulationService.getAllLatestReadings());
    }

    /**
     * Get persisted readings history from MySQL.
     */
    @GetMapping("/readings/history")
    public ResponseEntity<List<SensorReading>> getReadingsHistory(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String zone
    ) {
        return ResponseEntity.ok(simulationService.getReadingHistory(limit, zone));
    }

    /**
     * Get all active fire alerts.
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<FireAlert>> getAlerts() {
        return ResponseEntity.ok(simulationService.getActiveAlerts());
    }

    /**
     * Get persisted alert history from MySQL.
     */
    @GetMapping("/alerts/history")
    public ResponseEntity<List<FireAlert>> getAlertsHistory(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String zone
    ) {
        return ResponseEntity.ok(simulationService.getAlertHistory(limit, zone));
    }

    /**
     * Get alerts filtered by zone.
     */
    @GetMapping("/alerts/zone/{zoneName}")
    public ResponseEntity<List<FireAlert>> getAlertsByZone(@PathVariable String zoneName) {
        List<FireAlert> zoneAlerts = simulationService.getActiveAlerts().stream()
                .filter(a -> a.getZone().equalsIgnoreCase(zoneName))
                .toList();
        return ResponseEntity.ok(zoneAlerts);
    }

    /**
     * Full dashboard snapshot — zones + alerts combined.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> dashboard = new java.util.LinkedHashMap<>();
        dashboard.put("zones", simulationService.getAllZoneStatuses());
        dashboard.put("activeAlerts", simulationService.getActiveAlerts());
        dashboard.put("totalAlerts", simulationService.getTotalAlertCount());
        dashboard.put("timestamp", java.time.LocalDateTime.now());

        long criticalZones = simulationService.getAllZoneStatuses().stream()
                .filter(z -> "CRITICAL".equals(z.getOverallStatus()) 
                          || "DANGER".equals(z.getOverallStatus()))
                .count();
        dashboard.put("criticalZones", criticalZones);

        return ResponseEntity.ok(dashboard);
    }

    /**
     * Forest map snapshot — zone markers plus sensor pins for the frontend map.
     */
    @GetMapping("/map")
    public ResponseEntity<ForestMapSnapshot> getForestMap(org.springframework.security.core.Authentication auth) {
        String username = auth != null ? auth.getName() : "anonymous";
        String role = "ANONYMOUS";
        
        if (auth != null) {
            role = auth.getAuthorities().stream()
                    .map(r -> r.getAuthority())
                    .map(r -> r.replace("ROLE_", ""))
                    .findFirst()
                    .orElse("ANONYMOUS");
        }
        
        return ResponseEntity.ok(simulationService.getForestMapSnapshot(username, role));
    }
}
