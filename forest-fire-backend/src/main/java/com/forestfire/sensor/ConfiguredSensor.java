package com.forestfire.sensor;

/**
 * Runtime sensor defined by forest department staff.
 * Keeps the same simulation behavior as the core sensor types while
 * allowing custom model, location, and coverage metadata.
 */
public class ConfiguredSensor extends Sensor {

    private final String sensorType;
    private final String model;
    private final String unit;
    private final double dangerThreshold;
    private final double warningThreshold;
    private final double coverageRadiusKm;

    private final double fireEventProbability;
    private final double smokeSpikeProbability;
    private final double drySpellProbability;

    public ConfiguredSensor(String sensorId, String zone, String location, String sensorType, String model,
                            String unit, double dangerThreshold, double warningThreshold,
                            double coverageRadiusKm) {
        super(sensorId, zone, location);
        this.sensorType = sensorType.toUpperCase();
        this.model = model;
        this.unit = unit;
        this.dangerThreshold = dangerThreshold;
        this.warningThreshold = warningThreshold;
        this.coverageRadiusKm = coverageRadiusKm;
        this.fireEventProbability = 0.06;
        this.smokeSpikeProbability = 0.06;
        this.drySpellProbability = 0.08;
    }

    @Override
    public double simulate() {
        updateTimestamp();
        return switch (sensorType) {
            case "THERMAL" -> simulateThermal();
            case "SMOKE" -> simulateSmoke();
            case "HUMIDITY" -> simulateHumidity();
            default -> simulateThermal();
        };
    }

    private double simulateThermal() {
        double value;
        if (random.nextDouble() < fireEventProbability) {
            value = 68 + (random.nextDouble() * 24);
        } else {
            value = 28 + (random.nextGaussian() * 6);
            value = Math.max(15, Math.min(value, 44));
        }
        return Math.round(value * 10.0) / 10.0;
    }

    private double simulateSmoke() {
        double value;
        if (random.nextDouble() < smokeSpikeProbability) {
            value = 280 + (random.nextDouble() * 500);
        } else {
            value = 30 + (random.nextGaussian() * 15);
            value = Math.max(5, Math.min(value, 95));
        }
        return Math.round(value * 10.0) / 10.0;
    }

    private double simulateHumidity() {
        double value;
        if (random.nextDouble() < drySpellProbability) {
            value = 10 + (random.nextDouble() * 25);
        } else {
            value = 65 + (random.nextGaussian() * 12);
            value = Math.max(20, Math.min(value, 95));
        }
        return Math.round(value * 10.0) / 10.0;
    }

    @Override
    public String getUnit() { return unit; }

    @Override
    public String getSensorType() { return sensorType; }

    @Override
    public String getModel() { return model; }

    @Override
    public double getCoverageRadiusKm() { return coverageRadiusKm; }

    @Override
    public double getDangerThreshold() { return dangerThreshold; }

    @Override
    public boolean isDangerous(double value) {
        if ("HUMIDITY".equals(sensorType)) {
            return value <= dangerThreshold;
        }
        return value >= dangerThreshold;
    }

    public double getWarningThreshold() { return warningThreshold; }
}