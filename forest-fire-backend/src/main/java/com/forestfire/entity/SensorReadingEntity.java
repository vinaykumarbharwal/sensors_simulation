package com.forestfire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_readings", indexes = {
    @Index(name = "idx_reading_timestamp", columnList = "reading_timestamp"),
    @Index(name = "idx_reading_sensor_timestamp", columnList = "sensor_id, reading_timestamp")
})
public class SensorReadingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sensor_id")
    private SensorEntity sensor;

    @Column(name = "reading_value", nullable = false)
    private double value;

    @Column(nullable = false, length = 24)
    private String unit;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(nullable = false)
    private double dangerThreshold;

    @Column(name = "reading_timestamp", nullable = false)
    private LocalDateTime timestamp;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SensorEntity getSensor() { return sensor; }
    public void setSensor(SensorEntity sensor) { this.sensor = sensor; }

    public double getValue() { return value; }
    public void setValue(double value) { this.value = value; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getDangerThreshold() { return dangerThreshold; }
    public void setDangerThreshold(double dangerThreshold) { this.dangerThreshold = dangerThreshold; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
