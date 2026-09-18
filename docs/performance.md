# Performance notes

Current architecture:

- Homepage does not load parser engines.
- Tool execution runs in a browser worker.
- ToolShell normally reuses one worker for the mounted workspace.
- Stale worker responses are ignored by request id.

JSON benchmark command:

```sh
node --experimental-strip-types tests/performance/json-benchmark.mjs
```

Local observations from 2026-09-19 on this Windows development machine:

| Approximate input tier | Measured input bytes | Output bytes | Duration | RSS after run |
| --- | ---: | ---: | ---: | ---: |
| 1 KB | 987 | 1,396 | 7 ms | 56 MB |
| 100 KB | 99,993 | 141,370 | 75 ms | 70 MB |
| 1 MB | 999,979 | 1,413,764 | 315 ms | 144 MB |
| 3 MB | 2,999,993 | 4,241,370 | 583 ms | 316 MB |
| 5 MB reference only | 4,999,949 | 7,068,894 | 1,303 ms | 379 MB |

Timing observations should be treated as local measurements, not CI thresholds. CI keeps correctness, build, browser,
and security gates deterministic and avoids fragile timing assertions.
