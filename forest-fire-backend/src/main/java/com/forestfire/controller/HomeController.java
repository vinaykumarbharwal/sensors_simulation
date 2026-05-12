package com.forestfire.controller;

import com.forestfire.dao.ForestZoneRepository;
import com.forestfire.service.ForestRiskRegionCatalog;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class HomeController {

    private final ForestZoneRepository forestZoneRepository;
    private final int serverPort;

    public HomeController(ForestZoneRepository forestZoneRepository,
                          @Value("${server.port:8081}") int serverPort) {
        this.forestZoneRepository = forestZoneRepository;
        this.serverPort = serverPort;
    }

    @GetMapping({"/", "/api/v1"})
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("service", "Forest Fire Detection System");
        payload.put("status", "running");
        payload.put("baseApi", "/api/v1");
        payload.put("coverage", "India wildfire risk regions");
        payload.put("regionCount", ForestRiskRegionCatalog.REGIONS.size());
        payload.put("regions", ForestRiskRegionCatalog.REGIONS.stream()
                .map(ForestRiskRegionCatalog.RiskRegion::zoneName)
                .collect(Collectors.toList()));
        payload.put("routes", Map.of(
                "dashboard", "/api/v1/dashboard",
                "zones", "/api/v1/zones",
                "alerts", "/api/v1/alerts",
                "map", "/api/v1/map",
                "health", "/api/v1/health",
                "readingsHistory", "/api/v1/readings/history",
                "alertsHistory", "/api/v1/alerts/history"
        ));
        payload.put("port", serverPort);
        return ResponseEntity.ok(payload);
    }

    @GetMapping({"/health", "/api/v1/health"})
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("service", "Forest Fire Detection System");
        payload.put("timestamp", java.time.LocalDateTime.now());
        payload.put("port", serverPort);
        try {
            payload.put("status", "UP");
            payload.put("database", "UP");
            payload.put("zoneCount", forestZoneRepository.count());
        } catch (Exception ex) {
            payload.put("status", "DEGRADED");
            payload.put("database", "DOWN");
            payload.put("zoneCount", 0);
        }
        return ResponseEntity.ok(payload);
    }
}
