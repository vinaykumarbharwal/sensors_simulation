package com.forestfire.sensor;

/**
 * HumiditySensor monitors relative humidity (%).
 * Forests are safe when humidity is high.
 * Low humidity means dry conditions — fire risk increases.
 * 
 * Safe: > 60% RH
 * Warning: 30–60% RH  
 * Danger: ≤ 30% RH (very dry, high fire risk)
 */
public class HumiditySensor extends Sensor {

    private static final double BASE_HUMIDITY = 65.0; // healthy forest humidity
    private static final double DANGER_THRESHOLD = 30.0; // LOW is dangerous for humidity!
    private static final double WARNING_THRESHOLD = 50.0;

    public HumiditySensor(String sensorId, String zone, String location) {
        super(sensorId, zone, location);
    }

    @Override
    public double simulate() {
        updateTimestamp();
        double humidity;

        // Simulate drought / dry spell occasionally
        if (random.nextDouble() < 0.08) {
            // Dry spell event
            humidity = 10 + random.nextDouble() * 25; // 10–35%
        } else {
            // Normal seasonal variation
            double variation = random.nextGaussian() * 12;
            humidity = BASE_HUMIDITY + variation;
            humidity = Math.max(20, Math.min(humidity, 95));
        }

        return Math.round(humidity * 10.0) / 10.0;
    }

    @Override
    public String getUnit() { return "%"; }

    @Override
    public String getSensorType() { return "HUMIDITY"; }

    @Override
    public String getModel() { return "DryWatch H-120"; }

    @Override
    public double getCoverageRadiusKm() { return 4.0; }

    /**
     * For humidity, LOWER values are dangerous (opposite of other sensors).
     * Threshold is a minimum — below this is danger.
     */
    @Override
    public double getDangerThreshold() { return DANGER_THRESHOLD; }

    /**
     * Humidity sensor is dangerous when value is BELOW the threshold.
     */
    @Override
    public boolean isDangerous(double value) {
        return value <= getDangerThreshold();
    }

    public double getWarningThreshold() { return WARNING_THRESHOLD; }

    public boolean isWarning(double value) {
        return value <= WARNING_THRESHOLD && value > DANGER_THRESHOLD;
    }
}
