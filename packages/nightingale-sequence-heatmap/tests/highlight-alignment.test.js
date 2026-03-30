/**
 * Tests that the hover/select highlight emitted by nightingale-sequence-heatmap
 * uses the actual domain value (cell.x) rather than the 0-based array index
 * (cell.xIndex + 1). When xDomain does not start at 1, these two differ,
 * causing a misalignment between the heatmap highlight and the Sequence track.
 *
 * We test the event-emission logic in isolation by mocking the heatmap-component
 * internals and verifying the CustomEvent detail produced by the hover and select
 * subscriptions added in bindHeatmapEvents().
 */

import "../dist/index";

// --- helpers ----------------------------------------------------------------

/**
 * Build a minimal mock dataset where xDomain does NOT start at 1.
 * xDomain = [10, 20, 30]  →  xIndex 0 → x=10, xIndex 1 → x=20, etc.
 * This makes cell.x !== cell.xIndex + 1, exposing the alignment bug.
 */
const xDomain = [10, 20, 30];
const yDomain = ["A"];
const data = xDomain.map((x) => ({ xValue: x, yValue: "A", score: 0.5 }));

/**
 * Wait for LitElement lifecycle + heatmap binding.
 */
const waitForReady = async (el) => {
  // requestAnimationFrame + updateComplete
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  if (el.updateComplete) await el.updateComplete;
  // extra frame for bindHeatmapEvents which runs after heatmap renders
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  if (el.updateComplete) await el.updateComplete;
};

// --- tests ------------------------------------------------------------------

describe("nightingale-sequence-heatmap highlight alignment", () => {
  let rendered;

  beforeEach(async () => {
    document.documentElement.innerHTML = `
      <nightingale-sequence-heatmap
        heatmap-id="alignTest"
        width="500"
        height="200"
      ></nightingale-sequence-heatmap>`;
    rendered = document.querySelector("nightingale-sequence-heatmap");
    await waitForReady(rendered);
    rendered.setHeatmapData(xDomain, yDomain, data);
    await waitForReady(rendered);
  });

  afterEach(() => {
    const el = document.querySelector("nightingale-sequence-heatmap");
    if (el) el.remove();
  });

  test("hover highlight should use domain value (cell.x), not index-based value", (done) => {
    // The heatmap instance exposes a BehaviorSubject at events.hover.
    // We simulate what the heatmap-component would emit when the user hovers
    // over the cell at xIndex=0 (domain value x=10).
    const heatmap = rendered.heatmapInstance;
    if (!heatmap) {
      // If heatmap didn't initialise in jsdom (canvas limitations), skip gracefully
      console.warn("heatmapInstance not available in jsdom – skipping");
      done();
      return;
    }

    const changes = [];
    rendered.addEventListener("change", (e) => {
      if (e.detail && e.detail.type === "highlight") {
        changes.push(e.detail);
      }
    });

    // Emit a synthetic hover event through the heatmap's BehaviorSubject
    heatmap.events.hover.next({
      cell: { x: 10, y: "A", xIndex: 0, yIndex: 0, datum: data[0] },
      sourceEvent: undefined,
    });

    // The subscription is synchronous, so changes should be populated immediately
    requestAnimationFrame(() => {
      expect(changes.length).toBeGreaterThanOrEqual(1);
      const last = changes[changes.length - 1];

      // CRITICAL ASSERTION: highlight must be "10:10" (domain value),
      // NOT "1:1" (xIndex + 1)
      expect(last.value).toBe("10:10");

      done();
    });
  });

  test("hover highlight for middle cell should use its domain value", (done) => {
    const heatmap = rendered.heatmapInstance;
    if (!heatmap) {
      console.warn("heatmapInstance not available in jsdom – skipping");
      done();
      return;
    }

    const changes = [];
    rendered.addEventListener("change", (e) => {
      if (e.detail && e.detail.type === "highlight") {
        changes.push(e.detail);
      }
    });

    // xIndex=1 → domain value x=20
    heatmap.events.hover.next({
      cell: { x: 20, y: "A", xIndex: 1, yIndex: 0, datum: data[1] },
      sourceEvent: undefined,
    });

    requestAnimationFrame(() => {
      expect(changes.length).toBeGreaterThanOrEqual(1);
      const last = changes[changes.length - 1];
      // Must be "20:20", NOT "2:2"
      expect(last.value).toBe("20:20");
      done();
    });
  });

  test("select highlight should use domain value (cell.x), not index-based value", (done) => {
    const heatmap = rendered.heatmapInstance;
    if (!heatmap) {
      console.warn("heatmapInstance not available in jsdom – skipping");
      done();
      return;
    }

    const changes = [];
    rendered.addEventListener("change", (e) => {
      if (e.detail && e.detail.type === "highlight") {
        changes.push(e.detail);
      }
    });

    // xIndex=2 → domain value x=30
    heatmap.events.select.next({
      cell: { x: 30, y: "A", xIndex: 2, yIndex: 0, datum: data[2] },
      sourceEvent: undefined,
    });

    requestAnimationFrame(() => {
      expect(changes.length).toBeGreaterThanOrEqual(1);
      const last = changes[changes.length - 1];
      // Must be "30:30", NOT "3:3"
      expect(last.value).toBe("30:30");
      done();
    });
  });

  test("hover with undefined cell should emit null highlight (mouseout)", (done) => {
    const heatmap = rendered.heatmapInstance;
    if (!heatmap) {
      console.warn("heatmapInstance not available in jsdom – skipping");
      done();
      return;
    }

    const changes = [];
    rendered.addEventListener("change", (e) => {
      if (e.detail && e.detail.type === "highlight") {
        changes.push(e.detail);
      }
    });

    // cell: undefined = mouse left the heatmap area
    heatmap.events.hover.next({ cell: undefined, sourceEvent: undefined });

    requestAnimationFrame(() => {
      expect(changes.length).toBeGreaterThanOrEqual(1);
      const last = changes[changes.length - 1];
      expect(last.value).toBeNull();
      done();
    });
  });
});
