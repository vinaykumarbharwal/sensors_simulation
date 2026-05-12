package com.forestfire.model;

import java.time.LocalDateTime;
import java.util.List;

public class ForestMapSnapshot {

    private LocalDateTime generatedAt;
    private List<ForestMapZone> zones;
    private List<ForestMapOutpost> outposts;
    private int totalSensors;
    private int safeSensors;
    private int warningSensors;
    private int dangerSensors;

    public ForestMapSnapshot() {}

    public ForestMapSnapshot(LocalDateTime generatedAt, List<ForestMapZone> zones, List<ForestMapOutpost> outposts,
                             int totalSensors, int safeSensors, int warningSensors, int dangerSensors) {
        this.generatedAt = generatedAt;
        this.zones = zones;
        this.outposts = outposts;
        this.totalSensors = totalSensors;
        this.safeSensors = safeSensors;
        this.warningSensors = warningSensors;
        this.dangerSensors = dangerSensors;
    }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public List<ForestMapZone> getZones() { return zones; }
    public void setZones(List<ForestMapZone> zones) { this.zones = zones; }

    public List<ForestMapOutpost> getOutposts() { return outposts; }
    public void setOutposts(List<ForestMapOutpost> outposts) { this.outposts = outposts; }

    public int getTotalSensors() { return totalSensors; }
    public void setTotalSensors(int totalSensors) { this.totalSensors = totalSensors; }

    public int getSafeSensors() { return safeSensors; }
    public void setSafeSensors(int safeSensors) { this.safeSensors = safeSensors; }

    public int getWarningSensors() { return warningSensors; }
    public void setWarningSensors(int warningSensors) { this.warningSensors = warningSensors; }

    public int getDangerSensors() { return dangerSensors; }
    public void setDangerSensors(int dangerSensors) { this.dangerSensors = dangerSensors; }
}