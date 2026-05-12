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
            new RiskRegion("Nainital", "Uttarakhand", "Kumaon", "Pine and mixed forests with recurring pre-monsoon fire risk.", 29.3800, 79.4500, "VERY_HIGH"),
            new RiskRegion("Pauri Garhwal", "Uttarakhand", "Garhwal", "Dry hill slopes and human-forest interface zones prone to seasonal fires.", 30.1495, 78.7783, "VERY_HIGH"),
            new RiskRegion("Kullu", "Himachal Pradesh", "Kullu Valley", "Coniferous forest belt with dry spring fire seasons.", 31.9575, 77.1096, "HIGH"),
            new RiskRegion("Similipal", "Odisha", "Mayurbhanj", "Dense reserve forest where summer ignition risk rises sharply.", 21.9464, 86.7060, "VERY_HIGH"),
            new RiskRegion("Kandhamal", "Odisha", "Kandhamal", "Hills and dry deciduous forests with recurring fire incidents.", 20.4390, 84.0300, "HIGH"),
            new RiskRegion("Bastar", "Chhattisgarh", "South Bastar", "Dry deciduous forest landscape with frequent fire spread in hot months.", 19.1019, 81.9537, "VERY_HIGH"),
            new RiskRegion("Satpura", "Madhya Pradesh", "Satpura Range", "Tropical dry forest belt with recurring fire hotspots.", 22.5000, 78.5000, "HIGH"),
            new RiskRegion("Sahyadri", "Maharashtra", "Western Ghats", "Grassland and forest edges on the Ghats that often record dry-season fires.", 19.5000, 73.7000, "HIGH"),
            new RiskRegion("Kodagu", "Karnataka", "Western Ghats", "Moist-to-dry transition forests that can ignite during long dry spells.", 12.4244, 75.7382, "HIGH"),
            new RiskRegion("Nilgiris", "Tamil Nadu", "Nilgiri Biosphere", "Shola-grassland mosaics and eucalyptus edges exposed to fire spread.", 11.4064, 76.6932, "HIGH"),
            new RiskRegion("Araku", "Andhra Pradesh", "Eastern Ghats", "Eastern Ghats forest belt with seasonal dryness and ignition risk.", 18.3200, 82.8660, "MEDIUM"),
            new RiskRegion("Nallamala", "Telangana", "Amrabad/Nallamala", "Dry scrub and forest tracts where small fires can spread fast.", 16.3100, 79.4200, "HIGH")
    );

    private ForestRiskRegionCatalog() {}
}
