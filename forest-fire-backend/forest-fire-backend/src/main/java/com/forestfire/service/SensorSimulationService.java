package com.forestfire.service;

import com.forestfire.dao.FireAlertRepository;
import com.forestfire.dao.ForestZoneRepository;
import com.forestfire.dao.OutpostRepository;
import com.forestfire.dao.SensorReadingRepository;
import com.forestfire.dao.SensorRepository;
import com.forestfire.entity.FireAlertEntity;
import com.forestfire.entity.ForestOutpostEntity;
import com.forestfire.entity.ForestZoneEntity;
import com.forestfire.entity.SensorEntity;
import com.forestfire.entity.SensorReadingEntity;
import com.forestfire.model.AdminOutpostRequest;
import com.forestfire.model.AdminSensorRequest;
import com.forestfire.model.EquipmentUsageRequest;
import com.forestfire.model.EquipmentUsageResponse;
import com.forestfire.model.FireAlert;
import com.forestfire.model.ForestMapOutpost;
import com.forestfire.model.ForestMapResponsePlan;
import com.forestfire.model.ForestMapSensor;
import com.forestfire.model.ForestMapSnapshot;
import com.forestfire.model.ForestMapZone;
import com.forestfire.model.SensorReading;
import com.forestfire.model.ZoneStatus;
import com.forestfire.sensor.HumiditySensor;
import com.forestfire.sensor.ConfiguredSensor;
import com.forestfire.sensor.Sensor;
import com.forestfire.sensor.SmokeSensor;
import com.forestfire.sensor.ThermalSensor;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Core service that manages all sensors across the 3 forest zones and
 * simulates real-time sensor data.
 */
@Service
public class SensorSimulationService {

    private static final List<ForestRiskRegionCatalog.RiskRegion> ZONE_CATALOG = ForestRiskRegionCatalog.REGIONS;
    private static final String ROLE_EMPLOYEE = "EMPLOYEE";
    private static final String ROLE_HEAD = "HEAD";

    // All sensors keyed by sensorId
    private final Map<String, Sensor> sensors = new ConcurrentHashMap<>();

    // Latest readings per zone
    private final Map<String, List<SensorReading>> latestReadings = new ConcurrentHashMap<>();

    // Active alerts
    private final List<FireAlert> activeAlerts = Collections.synchronizedList(new ArrayList<>());

    // Track how long each zone has stayed safe before resolving the alert.
    private final Map<String, LocalDateTime> safeSinceByZone = new ConcurrentHashMap<>();

    private final ForestZoneRepository forestZoneRepository;
    private final OutpostRepository outpostRepository;
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final FireAlertRepository fireAlertRepository;

    private final int readingRetentionDays;

    private int alertCounter = 1;

    public SensorSimulationService(ForestZoneRepository forestZoneRepository,
                                   OutpostRepository outpostRepository,
                                   SensorRepository sensorRepository,
                                   SensorReadingRepository sensorReadingRepository,
                                   FireAlertRepository fireAlertRepository,
                                   @Value("${app.readings.retention-days:30}") int readingRetentionDays) {
        this.forestZoneRepository = forestZoneRepository;
        this.outpostRepository = outpostRepository;
        this.sensorRepository = sensorRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.fireAlertRepository = fireAlertRepository;
        this.readingRetentionDays = readingRetentionDays;
        initializeSensors();
    }

    @PostConstruct
    @Transactional
    public void initializeMetadataInDatabase() {
        for (ForestRiskRegionCatalog.RiskRegion region : ZONE_CATALOG) {
            ForestZoneEntity zoneEntity = forestZoneRepository.findByNameIgnoreCase(region.zoneName())
                    .orElseGet(() -> {
                        ForestZoneEntity entity = new ForestZoneEntity();
                        entity.setName(region.zoneName());
                        entity.setState(region.state());
                        entity.setDescription(region.description());
                        entity.setLatitude(region.latitude());
                        entity.setLongitude(region.longitude());
                        return forestZoneRepository.save(entity);
                    });

            sensors.values().stream()
                    .filter(sensor -> region.zoneName().equalsIgnoreCase(sensor.getZone()))
                    .forEach(sensor -> ensureSensorMetadata(sensor, zoneEntity));
        }
    }

    /**
     * Create one thermal, one smoke, one humidity sensor per zone.
     */
    private void initializeSensors() {
        for (ForestRiskRegionCatalog.RiskRegion region : ZONE_CATALOG) {
            String zone = region.zoneName();
            String z = zone.toLowerCase().replace(" ", "_");
            sensors.put(z + "_thermal", new ThermalSensor(z + "_thermal", zone, zone + " ridge"));
            sensors.put(z + "_smoke", new SmokeSensor(z + "_smoke", zone, zone + " core"));
            sensors.put(z + "_humidity", new HumiditySensor(z + "_humidity", zone, zone + " edge"));
        }
    }

    /**
     * Simulate all sensors and update readings + alerts.
     * Called by scheduler every few seconds.
     */
    @Transactional
    public void simulateAll() {
        Map<String, List<SensorReading>> newReadings = new LinkedHashMap<>();

        for (ForestRiskRegionCatalog.RiskRegion region : ZONE_CATALOG) {
            String zone = region.zoneName();
            List<SensorReading> zoneReadings = new ArrayList<>();
            String z = zone.toLowerCase().replace(" ", "_");

            String[] types = {"thermal", "smoke"};
            for (String type : types) {
                Sensor sensor = sensors.get(z + "_" + type);
                if (sensor != null && sensor.isActive()) {
                    double value = sensor.simulate();
                    String status = computeStatus(sensor, value);
                    SensorReading reading = new SensorReading(
                            sensor.getSensorId(),
                            sensor.getSensorType(),
                            sensor.getZone(),
                            sensor.getLocation(),
                            value,
                            sensor.getUnit(),
                            status,
                            LocalDateTime.now(),
                            sensor.getDangerThreshold()
                    );
                    zoneReadings.add(reading);
                }
            }
            newReadings.put(zone, zoneReadings);
        }

        latestReadings.putAll(newReadings);
        evaluateAlerts(newReadings);
        persistReadings(newReadings);
    }

    private String computeStatus(Sensor sensor, double value) {
        if (sensor instanceof HumiditySensor hs) {
            if (value <= hs.getDangerThreshold())  return "DANGER";
            if (value <= hs.getWarningThreshold()) return "WARNING";
            return "SAFE";
        } else if (sensor instanceof ThermalSensor ts) {
            if (value >= ts.getDangerThreshold())   return "DANGER";
            if (value >= ts.getWarningThreshold())  return "WARNING";
            return "SAFE";
        } else if (sensor instanceof SmokeSensor ss) {
            if (value >= ss.getDangerThreshold())   return "DANGER";
            if (value >= ss.getWarningThreshold())  return "WARNING";
            return "SAFE";
        }
        return sensor.isDangerous(value) ? "DANGER" : "SAFE";
    }

    private void evaluateAlerts(Map<String, List<SensorReading>> readings) {
        synchronized (activeAlerts) {
            LocalDateTime now = LocalDateTime.now();

            for (Map.Entry<String, List<SensorReading>> entry : readings.entrySet()) {
                String zone = entry.getKey();
                List<SensorReading> zoneReadings = entry.getValue();

                long dangerCount = zoneReadings.stream()
                        .filter(r -> "DANGER".equals(r.getStatus())).count();
                long warningCount = zoneReadings.stream()
                        .filter(r -> "WARNING".equals(r.getStatus())).count();

                FireAlert currentAlert = findActiveAlertForZone(zone);

                if (dangerCount == 0 && warningCount == 0) {
                    if (currentAlert != null) {
                        LocalDateTime safeSince = safeSinceByZone.computeIfAbsent(zone, key -> now);
                        if (safeSince.plusMinutes(5).isBefore(now) || safeSince.plusMinutes(5).isEqual(now)) {
                            currentAlert.setResolved(true);
                            currentAlert.setTimestamp(now);
                            persistAlert(currentAlert);
                            activeAlerts.remove(currentAlert);
                            safeSinceByZone.remove(zone);
                        }
                    }
                    continue;
                }

                safeSinceByZone.remove(zone);

                List<String> triggeredSensors = zoneReadings.stream()
                        .filter(r -> !"SAFE".equals(r.getStatus()))
                        .map(SensorReading::getSensorId).toList();

                int fireChance = calculateFireChance(zoneReadings);
                FireAlert.AlertLevel level;
                String message;

                if (dangerCount >= 2) {
                    level = FireAlert.AlertLevel.CRITICAL;
                    message = "CRITICAL: Multiple sensors in danger in " + zone +
                              ". Immediate forest fire response required.";
                } else if (dangerCount == 1) {
                    level = FireAlert.AlertLevel.HIGH;
                    message = "HIGH ALERT: Danger-level sensor reading detected in " + zone +
                              ". Fire risk is high.";
                } else {
                    level = FireAlert.AlertLevel.MEDIUM;
                    message = "WARNING: Elevated readings in " + zone +
                              ". Monitor closely.";
                }

                if (currentAlert == null) {
                    String alertId = createAlertId(zone);
                    currentAlert = new FireAlert(alertId, zone, level, message,
                            fireChance, triggeredSensors);
                    activeAlerts.add(currentAlert);
                } else {
                    currentAlert.setAlertLevel(level);
                    currentAlert.setMessage(message);
                    currentAlert.setFireChancePercent(Math.max(currentAlert.getFireChancePercent(), fireChance));
                    currentAlert.setTriggeredSensors(triggeredSensors);
                    currentAlert.setTimestamp(now);
                    currentAlert.setResolved(false);
                }

                persistAlert(currentAlert);
            }
        }
    }

    private FireAlert findActiveAlertForZone(String zone) {
        return activeAlerts.stream()
                .filter(a -> zone.equalsIgnoreCase(a.getZone()) && !a.isResolved())
                .findFirst()
                .orElse(null);
    }

    private int calculateFireChance(List<SensorReading> readings) {
        int score = 0;
        for (SensorReading r : readings) {
            switch (r.getStatus()) {
                case "DANGER"  -> score += 40;
                case "WARNING" -> score += 20;
            }
        }
        return Math.min(score, 98);
    }

    // ---- Public API methods ----

    public List<ZoneStatus> getAllZoneStatuses() {
        List<ZoneStatus> result = new ArrayList<>();
        for (ForestRiskRegionCatalog.RiskRegion region : ZONE_CATALOG) {
            String zone = region.zoneName();
            ZoneStatus zs = new ZoneStatus(zone,
                region.state(),
                region.description(),
                region.latitude(),
                region.longitude());

            List<SensorReading> readings = latestReadings.getOrDefault(zone, List.of());
            zs.setSensorReadings(readings);

            long dangerCount = readings.stream().filter(r -> "DANGER".equals(r.getStatus())).count();
            long warningCount = readings.stream().filter(r -> "WARNING".equals(r.getStatus())).count();

            if (dangerCount >= 2)      zs.setOverallStatus("CRITICAL");
            else if (dangerCount == 1) zs.setOverallStatus("DANGER");
            else if (warningCount > 0) zs.setOverallStatus("WARNING");
            else                       zs.setOverallStatus("SAFE");

            zs.setFireChancePercent(calculateFireChance(readings));
            boolean hasAlert = activeAlerts.stream()
                    .anyMatch(a -> zone.equals(a.getZone()) && !a.isResolved());
            zs.setHasActiveAlert(hasAlert);
            result.add(zs);
        }
        return result;
    }

    public ZoneStatus getZoneStatus(String zoneName) {
        return getAllZoneStatuses().stream()
                .filter(z -> z.getZoneName().equalsIgnoreCase(zoneName))
                .findFirst()
                .orElse(null);
    }

    public List<FireAlert> getActiveAlerts() {
        synchronized (activeAlerts) {
            return new ArrayList<>(activeAlerts.stream()
                    .filter(a -> !a.isResolved())
                    .toList());
        }
    }

    public Map<String, List<SensorReading>> getAllLatestReadings() {
        return new LinkedHashMap<>(latestReadings);
    }

    @Transactional(readOnly = true)
    public List<SensorReading> getReadingHistory(int limit, String zoneName) {
        int sanitizedLimit = Math.min(Math.max(limit, 1), 500);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(readingRetentionDays);

        if (StringUtils.hasText(zoneName)) {
            return sensorReadingRepository
                    .findBySensor_Zone_NameIgnoreCaseAndTimestampAfterOrderByTimestampDesc(
                            zoneName,
                            cutoff,
                            PageRequest.of(0, sanitizedLimit)
                    )
                    .stream()
                    .map(this::toModelReading)
                    .toList();
        }

        return sensorReadingRepository
                .findByTimestampAfterOrderByTimestampDesc(cutoff, PageRequest.of(0, sanitizedLimit))
                .stream()
                .map(this::toModelReading)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FireAlert> getAlertHistory(int limit, String zoneName) {
        int sanitizedLimit = Math.min(Math.max(limit, 1), 500);

        if (StringUtils.hasText(zoneName)) {
            return fireAlertRepository
                    .findByZoneIgnoreCaseOrderByTimestampDesc(zoneName, PageRequest.of(0, sanitizedLimit))
                    .stream()
                    .map(this::toModelAlert)
                    .toList();
        }

        return fireAlertRepository
                .findAllByOrderByTimestampDesc(PageRequest.of(0, sanitizedLimit))
                .stream()
                .map(this::toModelAlert)
                .toList();
    }

    @Transactional
    public long cleanupOldReadings() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(readingRetentionDays);
        return sensorReadingRepository.deleteByTimestampBefore(cutoff);
    }

    public ForestMapSnapshot getForestMapSnapshot() {
        List<ZoneStatus> zones = getAllZoneStatuses();
        List<ForestMapZone> mapZones = new ArrayList<>();
        List<ForestMapOutpost> mapOutposts = new ArrayList<>();
        int totalSensors = 0;
        int safeSensors = 0;
        int warningSensors = 0;
        int dangerSensors = 0;

        for (ZoneStatus zone : zones) {
            List<SensorReading> readings = latestReadings.getOrDefault(zone.getZoneName(), List.of());
            List<ForestMapSensor> mapSensors = new ArrayList<>();

            for (SensorReading reading : readings) {
                SensorCoordinate coordinate = resolveSensorCoordinate(
                        zone.getLatitude(),
                        zone.getLongitude(),
                        reading.getLocation()
                );

                SensorEntity sensorEntity = sensorRepository.findBySensorId(reading.getSensorId()).orElse(null);
                String sensorModel = sensorEntity != null ? sensorEntity.getModel() : reading.getSensorType();
                double coverageRadiusKm = sensorEntity != null ? sensorEntity.getCoverageRadiusKm() : 0.0;
                String createdByRole = sensorEntity != null ? sensorEntity.getCreatedByRole() : "UNKNOWN";

                mapSensors.add(new ForestMapSensor(
                        reading.getSensorId(),
                        reading.getSensorType(),
                    sensorModel,
                        reading.getZone(),
                        reading.getLocation(),
                        coordinate.latitude(),
                        coordinate.longitude(),
                        reading.getValue(),
                        reading.getUnit(),
                        reading.getStatus(),
                        reading.getTimestamp(),
                    reading.getDangerThreshold(),
                    coverageRadiusKm,
                    createdByRole
                ));

                totalSensors++;
                if ("DANGER".equals(reading.getStatus())) {
                    dangerSensors++;
                } else if ("WARNING".equals(reading.getStatus())) {
                    warningSensors++;
                } else {
                    safeSensors++;
                }
            }

            ForestOutpostEntity outpostEntity = outpostRepository.findByZoneNameIgnoreCase(zone.getZoneName()).orElse(null);
            ForestMapOutpost mapOutpost = outpostEntity != null ? toMapOutpost(outpostEntity) : null;
            if (mapOutpost != null) {
                mapOutposts.add(mapOutpost);
            }

            mapZones.add(new ForestMapZone(
                    zone.getZoneName(),
                    zone.getState(),
                    zone.getDescription(),
                    zone.getLatitude(),
                    zone.getLongitude(),
                    zone.getOverallStatus(),
                    zone.getFireChancePercent(),
                    zone.isHasActiveAlert(),
                    mapSensors,
                    mapOutpost,
                    buildResponsePlan(zone, mapOutpost, mapOutposts)
            ));
        }

        return new ForestMapSnapshot(
                LocalDateTime.now(),
                mapZones,
                mapOutposts,
                totalSensors,
                safeSensors,
                warningSensors,
                dangerSensors
        );
    }

    public int getTotalAlertCount() {
        return activeAlerts.size();
    }

    @Transactional
    public synchronized ForestMapSensor registerAdminSensor(AdminSensorRequest request, String actorRole) {
        if (!ROLE_EMPLOYEE.equalsIgnoreCase(actorRole)) {
            throw new IllegalArgumentException("Only EMPLOYEE role can add sensors");
        }

        ForestZoneEntity zoneEntity = forestZoneRepository.findByNameIgnoreCase(request.getZoneName())
                .orElseThrow(() -> new IllegalArgumentException("Zone not found: " + request.getZoneName()));

        String sensorType = (request.getSensorType() == null ? "THERMAL" : request.getSensorType().trim().toUpperCase());
        String sensorId = buildSensorId(zoneEntity.getName(), sensorType);
        String model = StringUtils.hasText(request.getModel()) ? request.getModel().trim() : resolveSensorModel(sensorType);
        String location = StringUtils.hasText(request.getLocation()) ? request.getLocation().trim() : zoneEntity.getName() + " field node";
        double coverageRadiusKm = request.getCoverageRadiusKm() > 0 ? request.getCoverageRadiusKm() : resolveCoverageRadius(sensorType);
        String createdByRole = "Forest Department Employee";

        SensorEntity entity = new SensorEntity();
        entity.setSensorId(sensorId);
        entity.setSensorType(sensorType);
        entity.setModel(model);
        entity.setLocation(location);
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());
        entity.setCoverageRadiusKm(coverageRadiusKm);
        entity.setCreatedByRole(createdByRole);
        entity.setZone(zoneEntity);

        SensorEntity saved = sensorRepository.save(entity);
        sensors.put(saved.getSensorId(), new ConfiguredSensor(
                saved.getSensorId(),
                zoneEntity.getName(),
                saved.getLocation(),
                sensorType,
                model,
                inferUnit(sensorType),
                inferDangerThreshold(sensorType),
                inferWarningThreshold(sensorType),
                coverageRadiusKm
        ));

        return new ForestMapSensor(
                saved.getSensorId(),
                saved.getSensorType(),
                saved.getModel(),
                zoneEntity.getName(),
                saved.getLocation(),
                saved.getLatitude(),
                saved.getLongitude(),
                0.0,
                inferUnit(sensorType),
                "SAFE",
                LocalDateTime.now(),
                inferDangerThreshold(sensorType),
                saved.getCoverageRadiusKm(),
                saved.getCreatedByRole()
        );
    }

    @Transactional
    public synchronized ForestMapOutpost registerAdminOutpost(AdminOutpostRequest request, String actorRole) {
        if (!ROLE_HEAD.equalsIgnoreCase(actorRole)) {
            throw new IllegalArgumentException("Only HEAD role can create outposts");
        }

        ForestZoneEntity zoneEntity = forestZoneRepository.findByNameIgnoreCase(request.getZoneName())
                .orElseThrow(() -> new IllegalArgumentException("Zone not found: " + request.getZoneName()));

        ForestOutpostEntity entity = outpostRepository.findByZoneNameIgnoreCase(zoneEntity.getName())
                .orElseGet(ForestOutpostEntity::new);
        entity.setOutpostId(StringUtils.hasText(entity.getOutpostId()) ? entity.getOutpostId() : buildOutpostId(zoneEntity.getName()));
        entity.setOutpostName(request.getOutpostName());
        entity.setZoneName(zoneEntity.getName());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());
        entity.setEmployeeCount(Math.max(request.getEmployeeCount(), 1));
        entity.setCreatedByRole("Forest Department Head");
        entity.setOperationalRole(StringUtils.hasText(request.getOperationalRole()) ? request.getOperationalRole().trim() : "MANPOWER_AND_UAV");
        entity.setCoverageRadiusKm(request.getCoverageRadiusKm() > 0 ? request.getCoverageRadiusKm() : 18.0);
        entity.setEquipmentCsv(toEquipmentCsv(normalizeEquipment(request.getEquipment(), zoneEntity.getName())));

        return toMapOutpost(outpostRepository.save(entity));
    }

    public EquipmentUsageResponse useOutpostEquipment(String outpostId, EquipmentUsageRequest request, String actorRole) {
        if (!ROLE_EMPLOYEE.equalsIgnoreCase(actorRole)) {
            throw new IllegalArgumentException("Only EMPLOYEE role can use outpost equipment");
        }

        ForestOutpostEntity outpost = outpostRepository.findByOutpostId(outpostId)
                .orElseThrow(() -> new IllegalArgumentException("Outpost not found: " + outpostId));

        String equipmentName = StringUtils.hasText(request.getEquipmentName()) ? request.getEquipmentName().trim() : "";
        if (!StringUtils.hasText(equipmentName)) {
            throw new IllegalArgumentException("equipmentName is required");
        }

        boolean assigned = parseEquipmentCsv(outpost.getEquipmentCsv()).stream().anyMatch(item -> item.equalsIgnoreCase(equipmentName));
        if (!assigned) {
            throw new IllegalArgumentException("Equipment is not assigned to this outpost: " + equipmentName);
        }

        return new EquipmentUsageResponse(
                outpost.getOutpostId(),
                equipmentName,
                StringUtils.hasText(request.getEmployeeId()) ? request.getEmployeeId().trim() : "UNKNOWN_EMPLOYEE",
                StringUtils.hasText(request.getPurpose()) ? request.getPurpose().trim() : "Field response",
                "APPROVED",
                LocalDateTime.now()
        );
    }

    private SensorCoordinate resolveSensorCoordinate(double zoneLatitude, double zoneLongitude, String location) {
        if (location == null || location.isBlank()) {
            return new SensorCoordinate(
                    roundToFourDecimals(zoneLatitude),
                    roundToFourDecimals(zoneLongitude)
            );
        }

        double latOffset = 0.0;
        double lonOffset = 0.0;
        String normalizedLocation = location.toLowerCase();
        if (normalizedLocation.contains("ridge") || normalizedLocation.contains("north")) {
            latOffset = 0.0045;
            lonOffset = -0.0015;
        } else if (normalizedLocation.contains("core") || normalizedLocation.contains("central")) {
            latOffset = 0.0002;
            lonOffset = 0.0002;
        } else if (normalizedLocation.contains("edge") || normalizedLocation.contains("south")) {
            latOffset = -0.0045;
            lonOffset = 0.0015;
        }

        return new SensorCoordinate(
                roundToFourDecimals(zoneLatitude + latOffset),
                roundToFourDecimals(zoneLongitude + lonOffset)
        );
    }

    private double roundToFourDecimals(double value) {
        return Math.round(value * 10000.0) / 10000.0;
    }

    private void persistReadings(Map<String, List<SensorReading>> readingsByZone) {
        for (List<SensorReading> readings : readingsByZone.values()) {
            for (SensorReading reading : readings) {
                if ("HUMIDITY".equalsIgnoreCase(reading.getSensorType())) {
                    continue;
                }

                SensorEntity sensorEntity = sensorRepository.findBySensorId(reading.getSensorId())
                        .orElseGet(() -> createSensorEntityFromReading(reading));

                SensorReadingEntity entity = new SensorReadingEntity();
                entity.setSensor(sensorEntity);
                entity.setValue(reading.getValue());
                entity.setUnit(reading.getUnit());
                entity.setStatus(reading.getStatus());
                entity.setDangerThreshold(reading.getDangerThreshold());
                entity.setTimestamp(reading.getTimestamp());
                sensorReadingRepository.save(entity);
            }
        }
    }

    private void persistAlert(FireAlert alert) {
        FireAlertEntity entity = fireAlertRepository.findByAlertId(alert.getAlertId())
                .orElseGet(FireAlertEntity::new);

        entity.setAlertId(alert.getAlertId());
        entity.setZone(alert.getZone().toLowerCase());
        entity.setAlertLevel(alert.getAlertLevel().name());
        entity.setMessage(alert.getMessage());
        entity.setFireChancePercent(alert.getFireChancePercent());
        List<String> triggeredSensors = alert.getTriggeredSensors() == null ? List.of() : alert.getTriggeredSensors();
        entity.setTriggeredSensors(String.join(",", triggeredSensors));
        entity.setTimestamp(alert.getTimestamp());
        entity.setResolved(alert.isResolved());

        fireAlertRepository.save(entity);
    }

    private SensorEntity createSensorEntityFromReading(SensorReading reading) {
        ForestZoneEntity zoneEntity = forestZoneRepository.findByNameIgnoreCase(reading.getZone())
                .orElseGet(() -> {
                    ForestZoneEntity zone = new ForestZoneEntity();
                    zone.setName(reading.getZone());
                    zone.setState("Unknown");
                    zone.setDescription(reading.getZone() + " Forest Zone");
                    zone.setLatitude(0.0);
                    zone.setLongitude(0.0);
                    return forestZoneRepository.save(zone);
                });

        SensorEntity sensorEntity = new SensorEntity();
        sensorEntity.setSensorId(reading.getSensorId());
        sensorEntity.setSensorType(reading.getSensorType());
        sensorEntity.setLocation(reading.getLocation());
        sensorEntity.setZone(zoneEntity);
        return sensorRepository.save(sensorEntity);
    }

    private void ensureSensorMetadata(Sensor sensor, ForestZoneEntity zoneEntity) {
        sensorRepository.findBySensorId(sensor.getSensorId())
                .orElseGet(() -> {
                    SensorEntity entity = new SensorEntity();
                    entity.setSensorId(sensor.getSensorId());
                    entity.setSensorType(sensor.getSensorType());
                    entity.setModel(sensor.getModel());
                    entity.setLocation(sensor.getLocation());
                    entity.setLatitude(zoneEntity.getLatitude());
                    entity.setLongitude(zoneEntity.getLongitude());
                    entity.setCoverageRadiusKm(sensor.getCoverageRadiusKm());
                    entity.setCreatedByRole("Forest Department Employee");
                    entity.setZone(zoneEntity);
                    return sensorRepository.save(entity);
                });
    }

    private ForestMapOutpost toMapOutpost(ForestOutpostEntity entity) {
        return new ForestMapOutpost(
                entity.getOutpostId(),
                entity.getOutpostName(),
                entity.getZoneName(),
                entity.getLatitude(),
                entity.getLongitude(),
                entity.getEmployeeCount(),
                entity.getCreatedByRole(),
                entity.getOperationalRole(),
                entity.getCoverageRadiusKm(),
                parseEquipmentCsv(entity.getEquipmentCsv())
        );
    }

    private ForestMapResponsePlan buildResponsePlan(ZoneStatus zone, ForestMapOutpost localOutpost,
                                                    List<ForestMapOutpost> allOutposts) {
        ForestMapOutpost nearestOutpost = localOutpost;
        if (nearestOutpost == null && !allOutposts.isEmpty()) {
            nearestOutpost = allOutposts.stream()
                    .min(Comparator.comparingDouble(candidate -> haversineKm(
                            zone.getLatitude(),
                            zone.getLongitude(),
                            candidate.getLatitude(),
                            candidate.getLongitude())))
                    .orElse(null);
        }

        double distanceKm = nearestOutpost == null ? 0.0 : haversineKm(
                zone.getLatitude(),
                zone.getLongitude(),
                nearestOutpost.getLatitude(),
                nearestOutpost.getLongitude());

        double impactRadiusKm = Math.max(2.0, zone.getFireChancePercent() / 10.0);
        double impactAreaSqKm = Math.PI * impactRadiusKm * impactRadiusKm;
        int manpowerRequired = Math.max(6, 4 + (zone.getFireChancePercent() / 8));
        int uavCount = zone.getFireChancePercent() >= 60 ? 2 : 1;
        int etaMinutes = Math.max(5, (int) Math.round((distanceKm / 45.0) * 60.0));

        return new ForestMapResponsePlan(
                nearestOutpost != null ? nearestOutpost.getOutpostName() : "Pending",
                nearestOutpost != null ? nearestOutpost.getZone() : zone.getZoneName(),
                roundToFourDecimals(distanceKm),
                roundToFourDecimals(impactRadiusKm),
                roundToFourDecimals(impactAreaSqKm),
                zone.getFireChancePercent() >= 70 ? "MANPOWER_AND_UAV" : "MANPOWER",
                manpowerRequired,
                uavCount,
                etaMinutes,
                nearestOutpost != null
                        ? "Route nearest outpost " + nearestOutpost.getOutpostName() + " for immediate containment."
                        : "No outpost assigned yet. Dispatch nearest available district team."
        );
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371.0;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private String buildSensorId(String zoneName, String sensorType) {
        String normalizedZone = zoneName.toUpperCase().replace(' ', '_');
        String normalizedType = sensorType.toUpperCase().replace(' ', '_');
        return "SENSOR-" + normalizedZone + "-" + normalizedType + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
    }

    private String buildOutpostId(String zoneName) {
        String normalizedZone = zoneName.toUpperCase().replace(' ', '_');
        return "OUTPOST-" + normalizedZone + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
    }

    private String resolveSensorModel(String sensorType) {
        return switch (sensorType.toUpperCase()) {
            case "THERMAL" -> "ThermoGuard X9";
            case "SMOKE" -> "AeroSense SM-300";
            case "HUMIDITY" -> "DryWatch H-120";
            default -> "ForestOps Standard";
        };
    }

    private String inferUnit(String sensorType) {
        return switch (sensorType.toUpperCase()) {
            case "THERMAL" -> "°C";
            case "SMOKE" -> "ppm";
            case "HUMIDITY" -> "%";
            default -> "units";
        };
    }

    private double resolveCoverageRadius(String sensorType) {
        return switch (sensorType.toUpperCase()) {
            case "THERMAL" -> 6.5;
            case "SMOKE" -> 5.2;
            case "HUMIDITY" -> 4.0;
            default -> 4.5;
        };
    }

    private double inferDangerThreshold(String sensorType) {
        return switch (sensorType.toUpperCase()) {
            case "THERMAL" -> 60.0;
            case "SMOKE" -> 300.0;
            case "HUMIDITY" -> 30.0;
            default -> 50.0;
        };
    }

    private double inferWarningThreshold(String sensorType) {
        return switch (sensorType.toUpperCase()) {
            case "THERMAL" -> 45.0;
            case "SMOKE" -> 100.0;
            case "HUMIDITY" -> 50.0;
            default -> 40.0;
        };
    }

    private List<String> normalizeEquipment(List<String> equipment, String zoneName) {
        if (equipment == null || equipment.isEmpty()) {
            return defaultEquipmentByRiskTier("HIGH");
        }
        return equipment.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();
    }

    private String toEquipmentCsv(List<String> equipment) {
        return String.join(",", normalizeEquipment(equipment, ""));
    }

    private List<String> parseEquipmentCsv(String equipmentCsv) {
        if (!StringUtils.hasText(equipmentCsv)) {
            return List.of();
        }
        return Arrays.stream(equipmentCsv.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private List<String> defaultEquipmentByRiskTier(String riskTier) {
        if ("VERY_HIGH".equalsIgnoreCase(riskTier)) {
            return List.of("Fire Suit", "Foam Tender", "Thermal Drone", "Night Vision UAV");
        }
        if ("HIGH".equalsIgnoreCase(riskTier)) {
            return List.of("Fire Suit", "Water Tanker", "Thermal Drone");
        }
        return List.of("Fire Suit", "Backpack Pump", "Drone");
    }

    private String createAlertId(String zone) {
        String normalizedZone = zone.toUpperCase().replace(' ', '_');
        return "ALERT-" + normalizedZone + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS")) + "-" + (alertCounter++);
    }

    private SensorReading toModelReading(SensorReadingEntity entity) {
        SensorEntity sensorEntity = entity.getSensor();
        ForestZoneEntity zoneEntity = sensorEntity.getZone();

        return new SensorReading(
                sensorEntity.getSensorId(),
                sensorEntity.getSensorType(),
                zoneEntity.getName(),
                sensorEntity.getLocation(),
                entity.getValue(),
                entity.getUnit(),
                entity.getStatus(),
                entity.getTimestamp(),
                entity.getDangerThreshold()
        );
    }

    private FireAlert toModelAlert(FireAlertEntity entity) {
        FireAlert alert = new FireAlert();
        alert.setAlertId(entity.getAlertId());
        alert.setZone(entity.getZone());
        alert.setAlertLevel(FireAlert.AlertLevel.valueOf(entity.getAlertLevel()));
        alert.setMessage(entity.getMessage());
        alert.setFireChancePercent(entity.getFireChancePercent());

        List<String> triggeredSensors = StringUtils.hasText(entity.getTriggeredSensors())
                ? Arrays.stream(entity.getTriggeredSensors().split(","))
                .filter(StringUtils::hasText)
                .toList()
                : List.of();
        alert.setTriggeredSensors(triggeredSensors);

        alert.setTimestamp(entity.getTimestamp());
        alert.setResolved(entity.isResolved());
        return alert;
    }

    private record SensorCoordinate(double latitude, double longitude) {}
}
