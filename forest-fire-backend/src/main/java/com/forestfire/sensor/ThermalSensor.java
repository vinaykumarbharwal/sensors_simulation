package com.forestfire.sensor;

/**
 * ThermalSensor monitors temperature in forest zones.
 * Normal forest temp: 20–35°C
 * Warning level: 45°C
 * Danger (fire risk): ≥ 60°C
 */
public class ThermalSensor extends Sensor {

    private static final double BASE_TEMP = 28.0;
    private static final double DANGER_THRESHOLD = 60.0;
    private static final double WARNING_THRESHOLD = 45.0;

    // Simulate fire event probability (0-1)
    private double fireEventProbability;

    public ThermalSensor(String sensorId, String zone, String location) {
        super(sensorId, zone, location);
        this.fireEventProbability = 0.05; // 5% chance of simulated fire spike
    }

    @Override
    public double simulate() {
        updateTimestamp();
        double temp;

        if (random.nextDouble() < fireEventProbability) {
            // Simulate a fire — temperature spike
            temp = BASE_TEMP + 40 + (random.nextDouble() * 30); // 68–98°C
        } else {
            // Normal forest temperature with daily variation
            double dailyVariation = random.nextGaussian() * 6;
            temp = BASE_TEMP + dailyVariation;
            temp = Math.max(15, Math.min(temp, 44)); // clamp to realistic range
        }

        return Math.round(temp * 10.0) / 10.0;
    }

    @Override
    public String getUnit() { return "°C"; }

    @Override
    public String getSensorType() { return "THERMAL"; }

    @Override
    public String getModel() { return "ThermoGuard X9"; }

    @Override
    public double getCoverageRadiusKm() { return 6.5; }

    @Override
    public double getDangerThreshold() { return DANGER_THRESHOLD; }

    public double getWarningThreshold() { return WARNING_THRESHOLD; }

    public void setFireEventProbability(double prob) {
        this.fireEventProbability = prob;
    }
}
