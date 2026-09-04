# Vanrakshak Backend Performance Benchmark Report

**Test date:** 31 August 2026

**Status:** JMeter load test completed successfully

## Executive result

Vanrakshak's authenticated Spring Boot API handled **255,286 measured API
requests in 60 seconds** at **50 concurrent users**, sustaining approximately
**4,205 requests/second** with **33 ms aggregate P95 latency**, **53 ms P99
latency**, and **0.00% errors**.

This result came from the populated-data run and excludes the one login request
used to obtain the JWT. The test ran locally against the disposable H2 benchmark
profile, so it is a development benchmark rather than a production capacity
guarantee.

## JMeter methodology

| Setting | Value |
|---|---|
| Tool | Apache JMeter 5.6.3, CLI/non-GUI mode |
| Application | Spring Boot 3.2.0 on Java 25.0.2 |
| Database | In-memory H2 in MySQL compatibility mode |
| Authentication | JWT login with BCrypt-backed benchmark user |
| Load | 50 concurrent threads |
| Ramp-up | 10 seconds |
| Test duration | 60 seconds |
| Workload | Five authenticated GET endpoints in sequence per iteration |
| Test data | 100 sensors created through the real admin API; 134 persisted readings present before the run |
| Success criterion | HTTP 200 assertion on every measured request |

The reusable plan is in `benchmarks/jmeter/vanrakshak-load-test.jmx`. The
reviewed result summary is committed at
`benchmark_results/jmeter-50-users-populated/SUMMARY.md`; bulky generated JTL,
CSV, and HTML dashboard artifacts remain local and are excluded from Git.

## Populated-data results

| Endpoint | Samples | Avg (ms) | Median (ms) | P90 (ms) | P95 (ms) | P99 (ms) | Max (ms) | Throughput (req/s) | Errors |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Sensor Readings | 51,073 | 9.53 | 8 | 25 | 31 | 42 | 102 | ~851 | 0.00% |
| Active Alerts | 51,068 | 8.54 | 7 | 24 | 29 | 41 | 100 | ~851 | 0.00% |
| Dashboard | 51,062 | 9.64 | 8 | 25 | 31 | 42 | 99 | ~851 | 0.00% |
| Readings History | 51,050 | 16.45 | 16 | 33 | 38 | 55 | 108 | ~851 | 0.00% |
| Zones | 51,033 | 9.50 | 8 | 25 | 30 | 42 | 112 | ~851 | 0.00% |
| **Aggregate API workload** | **255,286** | **10.73** | **10** | **27** | **33** | **53** | **112** | **~4,205** | **0.00%** |

The history endpoint was the most expensive route, with 16.45 ms mean and 38
ms P95 latency, but it remained error-free during this workload.

## Resource snapshot

During the populated run, the backend JVM reached approximately **650 MB peak
working set** and **710 MB peak private memory**. It consumed an average of
about **8.58 logical CPU cores**, or **53.6% of the 16-logical-processor test
machine's capacity**, over the sampled interval.

These are process-level Windows measurements, not JVM heap-only metrics.

## Ceiling run

Before data was seeded, the same plan measured approximately **6,834 req/s**,
15 ms P95, 22 ms P99, and zero errors across 410,160 API requests. Because the
responses were nearly empty, this run is retained only as a framework/network
ceiling and should not be used as the resume claim.

## Project understanding

Vanrakshak is a full-stack forest-fire monitoring and early-warning system:

- A React 19 + TypeScript + Vite dashboard displays risk regions, sensor data,
  alerts, maps, account views, and role-aware operational controls.
- A Spring Boot REST backend exposes 20 routes across authentication, monitoring,
  history, account, and admin functions.
- Spring Security provides stateless JWT authentication and role-based access for
  employee and head/admin users; passwords are BCrypt encoded.
- Spring Data JPA persists zones, sensors, readings, alerts, users, and outposts
  to MySQL in production, with H2 profiles for local development and benchmarks.
- A scheduled simulation runs every 20 seconds, evaluates thermal, smoke, and
  humidity readings, computes zone risk, creates alerts, and applies seven-day
  reading retention.

## Engineering observations

- `persistReadings()` performs a sensor lookup and save for each reading. Loading
  sensors once and batching inserts is the main database-write optimization
  opportunity.
- Humidity values participate in alert evaluation but are intentionally skipped
  when readings are persisted. Stored-reading throughput therefore does not
  represent all simulated sensor activity.
- History APIs enforce a maximum page size of 500.
- Read paths use fetch-join repository queries for recent readings and sensors,
  reducing obvious N+1 behavior on dashboard/history requests.
- The load test uses local H2 and shares a machine with JMeter. A production
  capacity claim requires a separate load generator, production-like MySQL,
  realistic dataset volume, network latency, and a longer soak test.

## Resume-ready summary

Use these bullets only if they accurately reflect your personal contribution:

> Developed Vanrakshak, a full-stack forest-fire early-warning platform using
> React, TypeScript, Spring Boot, Spring Security, JPA, and MySQL, with 20 REST
> routes supporting sensor monitoring, alerting, historical analytics, and
> role-based field operations across five risk regions.

> Implemented JWT/BCrypt authentication, employee/admin authorization, and a
> 20-second scheduled sensor-processing pipeline that combines thermal, smoke,
> and humidity signals into zone-level risk scores and alerts.

> Designed and executed an authenticated Apache JMeter load test with 50
> concurrent users, sustaining approximately 4,205 requests/second across
> 255,286 API requests with 33 ms P95 latency and 0% errors in a 60-second local
> H2 benchmark.

## Interview-safe one-line description

> Vanrakshak is a React and Spring Boot forest-fire monitoring platform that
> simulates environmental sensors, evaluates multi-signal fire risk every 20
> seconds, persists readings and alerts, and provides JWT-secured dashboards and
> role-based operational APIs.
