#!/usr/bin/env bash
# ============================================================================
# Vanrakshak backend — scheduled sensor-processing throughput test
#
# Verified from source: SensorScheduler.runSimulation() fires every 20000ms
# (fixedRate) and calls SensorSimulationService.simulateAll(). Only THERMAL
# and SMOKE readings are persisted to sensor_readings (persistReadings()
# explicitly skips HUMIDITY) — so persisted-row counts undercount total
# readings simulated per cycle by the humidity-sensor share.
#
# This script is intentionally black-box: it does NOT add logging or timers
# inside the app. It creates N sensors via the real admin API, then measures
# how many reading rows and alerts accumulate in the database over a known
# wall-clock window by polling the real REST endpoints. That is a fair,
# unmodified measurement of end-to-end throughput.
#
# Run once per sensor count (10, 50, 100), restarting the backend between
# runs so each test starts from a clean H2 in-memory database
# (spring.jpa.hibernate.ddl-auto=create-drop wipes it on restart).
#
# Usage:
#   ./run_sensor_processing_test.sh 10      # or 50, or 100
#   ./run_sensor_processing_test.sh 10 180  # optional: window seconds (default 130s ~ 6 cycles)
# ============================================================================
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8081}"
SENSOR_COUNT="${1:-10}"
WINDOW_SECONDS="${2:-130}"   # ~6-7 scheduler cycles at 20s/cycle
OUT_DIR="./benchmark_results"
mkdir -p "$OUT_DIR"

ZONES=("North India" "South India" "East India" "West India" "Central India")
TYPES=("THERMAL" "SMOKE")   # HUMIDITY intentionally excluded — not persisted (verified in source)

echo "== Logging in =="
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"employee","password":"employee123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -z "$TOKEN" ] && { echo "Login failed — check backend is up on $BASE_URL"; exit 1; }
AUTH_HEADER="Authorization: Bearer $TOKEN"

echo "== Creating $SENSOR_COUNT sensors (mixed THERMAL/SMOKE, spread across 5 zones) =="
CREATED=0
for i in $(seq 1 "$SENSOR_COUNT"); do
  ZONE="${ZONES[$((i % 5))]}"
  TYPE="${TYPES[$((i % 2))]}"
  RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/admin/sensors" \
    -H "$AUTH_HEADER" -H "Content-Type: application/json" \
    -d "{\"zoneName\":\"$ZONE\",\"sensorType\":\"$TYPE\",\"model\":\"BenchSensor\",\"location\":\"bench-node-$i\",\"latitude\":20.0,\"longitude\":78.0,\"coverageRadiusKm\":5.0}")
  if [ "$RESP" == "200" ]; then CREATED=$((CREATED+1)); fi
done
echo "Created $CREATED / $SENSOR_COUNT sensors."

count_readings() {
  curl -s "$BASE_URL/api/v1/readings/history?limit=500" -H "$AUTH_HEADER" \
    | grep -o '"sensorId"' | wc -l
}
count_alerts() {
  curl -s "$BASE_URL/api/v1/alerts/history?limit=500" -H "$AUTH_HEADER" \
    | grep -o '"alertId"' | wc -l
}

echo "== Baseline snapshot =="
START_READINGS=$(count_readings)
START_ALERTS=$(count_alerts)
START_TS=$(date +%s)
echo "  readings=$START_READINGS  alerts=$START_ALERTS  at t=0"

echo "== Waiting ${WINDOW_SECONDS}s (~$((WINDOW_SECONDS/20)) scheduler cycles at 20s each) =="
sleep "$WINDOW_SECONDS"

END_READINGS=$(count_readings)
END_ALERTS=$(count_alerts)
END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

DELTA_READINGS=$((END_READINGS - START_READINGS))
DELTA_ALERTS=$((END_ALERTS - START_ALERTS))

# NOTE: /readings/history is capped at limit=500 by the controller
# (sanitizedLimit = min(max(limit,1),500) in SensorSimulationService).
# If DELTA_READINGS == 500 (i.e. it hit the cap), the true count is higher —
# flag this rather than reporting a false throughput number.
CAPPED=""
if [ "$END_READINGS" -ge 500 ] || [ "$DELTA_READINGS" -ge 500 ]; then
  CAPPED=" (WARNING: hit the 500-row API cap — re-run with a shorter window or query the DB directly for the true count)"
fi

READINGS_PER_SEC=$(awk -v d="$DELTA_READINGS" -v e="$ELAPSED" 'BEGIN{ if(e>0) printf "%.3f", d/e; else print "n/a" }')
READINGS_PER_MIN=$(awk -v d="$DELTA_READINGS" -v e="$ELAPSED" 'BEGIN{ if(e>0) printf "%.1f", (d/e)*60; else print "n/a" }')
READINGS_PER_HOUR=$(awk -v d="$DELTA_READINGS" -v e="$ELAPSED" 'BEGIN{ if(e>0) printf "%.0f", (d/e)*3600; else print "n/a" }')

RESULT_FILE="$OUT_DIR/sensor_processing_${SENSOR_COUNT}.md"
{
  echo "## Sensor processing test — $SENSOR_COUNT sensors"
  echo ""
  echo "- Window: ${ELAPSED}s (requested ${WINDOW_SECONDS}s)"
  echo "- Persisted readings delta: $DELTA_READINGS$CAPPED"
  echo "- Alerts delta: $DELTA_ALERTS"
  echo "- Measured throughput: $READINGS_PER_SEC readings/sec, $READINGS_PER_MIN readings/min, $READINGS_PER_HOUR readings/hour"
  echo ""
  echo "Reminder: HUMIDITY-type readings are simulated and evaluated for alerts"
  echo "but are NOT written to sensor_readings (verified in SensorSimulationService."
  echo "persistReadings — humidity is explicitly skipped). This throughput reflects"
  echo "THERMAL + SMOKE persisted rows only, not total sensor activity."
} | tee "$RESULT_FILE"

echo ""
echo "Saved to $RESULT_FILE"
