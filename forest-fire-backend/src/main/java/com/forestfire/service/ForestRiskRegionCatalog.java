package com.forestfire.service;

import java.util.List;

/**
 * Compact, curated wildfire risk catalog for India.
 * Based on Forest Survey of India monitoring and widely reported fire-prone forest belts.
 * Kept intentionally small to fit the 1 GB database budget.
 */
public final class ForestRiskRegionCatalog {

    public record RiskRegion(
            String zoneName,
            String state,
            String districtOrRange,
            String description,
            double latitude,
            double longitude,
            String riskTier
    ) {}

    public static final List<RiskRegion> REGIONS = List.of(
            new RiskRegion("North India", "Various", "Himalayan Region", "Pine and mixed forests with recurring pre-monsoon fire risk.", 31.0000, 77.0000, "VERY_HIGH"),
            new RiskRegion("South India", "Various", "Western and Eastern Ghats", "Moist-to-dry transition forests that can ignite during long dry spells.", 13.0000, 77.0000, "HIGH"),
            new RiskRegion("East India", "Various", "Eastern Region", "Dense reserve forest where summer ignition risk rises sharply.", 22.0000, 86.0000, "VERY_HIGH"),
            new RiskRegion("West India", "Various", "Western Region", "Grassland and forest edges that often record dry-season fires.", 20.0000, 73.0000, "HIGH"),
            new RiskRegion("Central India", "Various", "Central Region", "Tropical dry forest belt with recurring fire hotspots.", 22.5000, 78.5000, "VERY_HIGH")
    );

    private ForestRiskRegionCatalog() {}
}
