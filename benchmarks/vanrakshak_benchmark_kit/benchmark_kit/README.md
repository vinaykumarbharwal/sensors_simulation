# Vanrakshak Benchmark Kit

This kit lets you run the **real** load test on your own machine, since Maven
Central isn't reachable from the sandbox this analysis was done in (see the
chat response for why). Everything here is config/tooling only — **no
business logic in the Spring Boot app is touched.**

## 0. Prerequisites
- JDK 17 (project requires it — confirmed in `pom.xml`)
- Maven (or use the Maven wrapper if you add one)
- Apache Bench: `sudo apt-get install apache2-utils` (Linux) or `brew install httpd` (macOS, `ab` ships with it)
- `curl`

## 1. Drop in the benchmark profile
```bash
cp application-benchmark.properties <repo>/forest-fire-backend/src/main/resources/
```
This profile:
- Uses an in-memory H2 database (`MODE=MySQL`) — no external DB, no
  credentials needed, and it's disposable (wiped on every restart).
- Leaves the real 20-second `SensorScheduler` running (the default
  `application-local.properties` in the repo disables scheduling — this one
  doesn't, since Step 4 of the benchmark needs the real job running).
- Leaves JWT auth **on** (`app.security.enforce=true`) with local-only
  seeded credentials (`employee`/`employee123`, `head`/`head123`) so the API
  test exercises the same auth path production traffic would.

## 2. Run the backend
```bash
cd <repo>/forest-fire-backend
mvn spring-boot:run -Dspring-boot.run.profiles=benchmark
```
Wait for `Started ForestFireApplication` in the logs. Leave it running.

## 3. API load test (Step 3 of the benchmark)
In another terminal:
```bash
chmod +x run_api_benchmark.sh
./run_api_benchmark.sh
```
This logs in, then runs Apache Bench against 5 core endpoints (`/sensors/readings`,
`/alerts`, `/dashboard`, `/readings/history`, `/zones`) at 50–100 concurrent
users / 2000–3000 requests each, and prints a Markdown table with Avg/P50/P90/
P95/Max/throughput/error-rate — pulled directly from `ab`'s output, nothing
invented. Edit the `TESTS` array in the script to change endpoints or load
levels (e.g. lower them if `ab` reports connection errors — note that you
had to in the final report).

## 4. Sensor-processing throughput test (Step 4)
Restart the backend fresh before each run (H2 is in-memory and resets on
restart, giving you a clean baseline):
```bash
./run_sensor_processing_test.sh 10    # then restart backend, run again:
./run_sensor_processing_test.sh 50
./run_sensor_processing_test.sh 100
```
Each run creates that many sensors via the real `/api/v1/admin/sensors`
endpoint, waits ~130s (≈6-7 scheduler cycles at the verified 20s fixed rate),
and measures how many reading rows / alerts actually appeared — a black-box,
unmodified measurement. It also flags if you hit the API's 500-row history
cap so you don't misread a capped count as the true throughput.

**Important verified caveat baked into the script:** `persistReadings()` in
`SensorSimulationService` explicitly skips `HUMIDITY` readings — they're
simulated and used for alert evaluation but never written to
`sensor_readings`. So this measures THERMAL+SMOKE persisted throughput, not
total simulated readings. Note this in your final numbers.

## 5. Database performance (Step 5)
Two queries already use `JOIN FETCH` and look reasonable
(`findRecentWithDetails`, `findRecentByZoneWithDetails`, `findAllWithZone`).
One real inefficiency verified in source: `persistReadings()` calls
`sensorRepository.findBySensorId(...)` then `.save(...)` **per reading, in a
loop** — one SELECT + one INSERT round trip per reading rather than a batch.
If you want a real Before → After number for the report:
1. Time a sensor-processing run as-is (Before).
2. Only if you choose to, refactor `persistReadings` to load sensors once
   into a map and use `saveAll(...)`.
3. Re-run the same test (After).
Only report both numbers if you actually did both runs — don't report a
theoretical "After" you didn't measure.

## 6. Resource usage (Step 6)
While `run_api_benchmark.sh` is running, in another terminal:
```bash
jcmd $(pgrep -f vanrakshak) GC.heap_info      # heap snapshot
top -p $(pgrep -f vanrakshak)                 # CPU/RSS over time
```
There's no Spring Boot Actuator dependency in `pom.xml`, so there's no
`/actuator/metrics` endpoint out of the box — `jcmd`/`top`/VisualVM are your
options without adding a dependency.

## 7. Filling in the report
`BENCHMARK_REPORT.md` (in the same delivery) has the exact tables from your
request with placeholders. Copy the numbers from `benchmark_results/summary.md`
and the `sensor_processing_*.md` files into it, then use the "Resume-ready
metrics" section at the bottom, replacing every `X` with what you actually
measured.
