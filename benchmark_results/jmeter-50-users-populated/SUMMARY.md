# JMeter result summary

- Date: 31 August 2026
- Load: 50 concurrent users, 10-second ramp-up, 60-second duration
- Dataset: 100 sensors and 134 persisted readings before the test
- Measured API samples: 255,286 (login excluded)
- Aggregate throughput: approximately 4,205 requests/second
- Aggregate latency: 10.73 ms average, 33 ms P95, 53 ms P99, 112 ms maximum
- Errors: 0 (0.00%)
- Backend process: 650 MB peak working set, 710 MB peak private memory
- CPU: approximately 8.58 logical cores on average (53.6% of 16 logical CPUs)

| Endpoint | Samples | Average | P95 | P99 | Errors |
|---|---:|---:|---:|---:|---:|
| Sensor Readings | 51,073 | 9.53 ms | 31 ms | 42 ms | 0 |
| Active Alerts | 51,068 | 8.54 ms | 29 ms | 41 ms | 0 |
| Dashboard | 51,062 | 9.64 ms | 31 ms | 42 ms | 0 |
| Readings History | 51,050 | 16.45 ms | 38 ms | 55 ms | 0 |
| Zones | 51,033 | 9.50 ms | 30 ms | 42 ms | 0 |

See `html-report/index.html` for the generated Apache JMeter dashboard. Results
are from a local H2 benchmark and are not a production capacity guarantee.
