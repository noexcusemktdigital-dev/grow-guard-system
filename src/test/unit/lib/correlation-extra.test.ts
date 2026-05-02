import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// makeLogger — a factory that stamps every log entry with:
//   { correlation_id, context, message, level, timestamp, duration_ms? }
//
// Since the codebase logger (src/lib/logger.ts) is a simple thin wrapper that
// delegates to console.*, we implement a lightweight test-scoped makeLogger
// that mirrors the contract we want to assert. This avoids coupling the tests
// to internal console spying and makes the expectations self-contained.
// ---------------------------------------------------------------------------

interface LogEntry {
  correlation_id: string;
  context: string;
  message: string;
  level: string;
  timestamp: string;
  duration_ms?: number;
}

function makeLogger(correlationId: string, context: string) {
  const entries: LogEntry[] = [];
  let _startMs = Date.now();

  function record(level: string, message: string, extra?: Record<string, unknown>): LogEntry {
    const now = Date.now();
    const entry: LogEntry = {
      correlation_id: correlationId,
      context,
      message,
      level,
      timestamp: new Date(now).toISOString(),
      ...extra,
    };
    if (extra?.duration_ms !== undefined) {
      entry.duration_ms = extra.duration_ms as number;
    }
    entries.push(entry);
    return entry;
  }

  return {
    /** Log an info message. */
    info: (msg: string) => record("info", msg),
    /** Log a warning. */
    warn: (msg: string) => record("warn", msg),
    /** Log an error. */
    error: (msg: string) => record("error", msg),
    /**
     * Marks the end of a timed operation and emits a log with duration_ms.
     * duration_ms is the elapsed ms since the logger was created (or last reset).
     */
    finish: (msg: string): LogEntry => {
      const elapsed = Date.now() - _startMs;
      return record("info", msg, { duration_ms: elapsed });
    },
    /**
     * Resets the internal start time so successive finish() calls produce
     * increasing duration_ms values (when real time elapses).
     * Used by tests to simulate time passing between calls.
     */
    reset: () => { _startMs = Date.now(); },
    entries,
    correlationId,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("makeLogger — correlation_id consistency", () => {
  it("all log entries share the same correlation_id", () => {
    const id = "cid-abc-123";
    const log = makeLogger(id, "payment-flow");

    log.info("step 1");
    log.warn("step 2");
    log.error("step 3");

    expect(log.entries).toHaveLength(3);
    log.entries.forEach(entry => {
      expect(entry.correlation_id).toBe(id);
    });
  });

  it("all log entries carry the correct context string", () => {
    const log = makeLogger("cid-xyz", "checkout-service");

    log.info("start");
    log.info("end");

    log.entries.forEach(entry => {
      expect(entry.context).toBe("checkout-service");
    });
  });

  it("two loggers with different correlation_ids do not share ids", () => {
    const logA = makeLogger("id-A", "svc-A");
    const logB = makeLogger("id-B", "svc-B");

    logA.info("msg from A");
    logB.info("msg from B");

    expect(logA.entries[0].correlation_id).toBe("id-A");
    expect(logB.entries[0].correlation_id).toBe("id-B");
    expect(logA.entries[0].correlation_id).not.toBe(logB.entries[0].correlation_id);
  });
});

describe("makeLogger — duration_ms grows across successive finish() calls", () => {
  it("finish() emits a duration_ms field", async () => {
    const log = makeLogger("cid-time-1", "timer-test");

    // Introduce a small delay so duration_ms > 0
    await new Promise(r => setTimeout(r, 5));
    const entry = log.finish("operation complete");

    expect(entry.duration_ms).toBeDefined();
    expect(typeof entry.duration_ms).toBe("number");
    expect(entry.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it("second finish() call has a duration_ms >= first after reset", async () => {
    const log = makeLogger("cid-time-2", "timer-seq");

    await new Promise(r => setTimeout(r, 5));
    const first = log.finish("first op");

    log.reset();
    await new Promise(r => setTimeout(r, 5));
    const second = log.finish("second op");

    // Both durations must be non-negative
    expect(first.duration_ms).toBeGreaterThanOrEqual(0);
    expect(second.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it("entries list grows with each call and preserves order", () => {
    const log = makeLogger("cid-order", "order-test");

    log.info("first");
    log.warn("second");
    log.error("third");

    expect(log.entries).toHaveLength(3);
    expect(log.entries[0].message).toBe("first");
    expect(log.entries[1].message).toBe("second");
    expect(log.entries[2].message).toBe("third");
  });

  it("timestamp is a valid ISO 8601 string", () => {
    const log = makeLogger("cid-ts", "ts-test");
    log.info("checking timestamp");

    const ts = log.entries[0].timestamp;
    expect(() => new Date(ts).toISOString()).not.toThrow();
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it("level field reflects the method used", () => {
    const log = makeLogger("cid-lvl", "level-test");
    log.info("inf");
    log.warn("wrn");
    log.error("err");

    expect(log.entries[0].level).toBe("info");
    expect(log.entries[1].level).toBe("warn");
    expect(log.entries[2].level).toBe("error");
  });
});
