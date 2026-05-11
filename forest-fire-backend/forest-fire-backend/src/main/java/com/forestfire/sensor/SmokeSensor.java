package com.forestfire.sensor;

/**
 * SmokeSensor detects smoke density in the air (ppm - parts per million).
 * Safe: 0–100 ppm
 * Warning: 100–300 ppm
 * Danger (fire likely): ≥ 300 ppm
 */
public class SmokeSensor extends Sensor {

    private static final double BASE_SMOKE = 30.0;    // background ppm
    private static final double DANGER_THRESHOLD = 300.0;
    private static final double WARNING_THRESHOLD = 100.0;

    private double smokeSpikeProb;

    public SmokeSensor(String sensorId, String zone, String location) {
        super(sensorId, zone, location);
        this.smokeSpikeProb = 0.05;
    }

    @Override
    public double simulate() {
        updateTimestamp();
        double smoke;

        if (random.nextDouble() < smokeSpikeProb) {
            // Fire/smoke event
            smoke = 280 + random.nextDouble() * 500; // 280–780 ppm
        } else {
            // Normal air with slight variation (campfires, wind etc.)
            double variation = random.nextGaussian() * 15;
            smoke = BASE_SMOKE + variation;
            smoke = Math.max(5, Math.min(smoke, 95));
        }

        return Math.round(smoke * 10.0) / 10.0;
    }

    @Override
    public String getUnit() { return "ppm"; }

    @Override
    public String getSensorType() { return "SMOKE"; }

    @Override
    public String getModel() { return "AeroSense SM-300"; }

    @Override
    public double getCoverageRadiusKm() { return 5.2; }

    @Override
    public double getDangerThreshold() { return DANGER_THRESHOLD; }

    public double getWarningThreshold() { return WARNING_THRESHOLD; }

    public void setSmokeSpikeProb(double prob) {
        this.smokeSpikeProb = prob;
    }
}
