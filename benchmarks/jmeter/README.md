# Vanrakshak JMeter load test

This plan authenticates once with the benchmark-only employee account and then
drives five core read endpoints with a closed workload. Every request asserts
HTTP 200, so the JMeter error percentage includes assertion and HTTP failures.

Run the backend with the `benchmark` Spring profile, then execute JMeter in
non-GUI mode:

```powershell
jmeter -n -t vanrakshak-load-test.jmx `
  -Jthreads=50 -Jramp=10 -Jduration=60 `
  -l results.jtl -e -o report
```

Defaults are 50 concurrent threads, a 10-second ramp-up, and a 60-second
duration. Override `host` and `port` with `-Jhost=...` and `-Jport=...`.

The login sample is setup traffic and should be excluded when quoting the
aggregate throughput of the core API workload.
