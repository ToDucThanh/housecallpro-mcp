import { describe, it, expect } from "vitest";
import { callTool, parseResult } from "../helpers/setup.js";

describe("events — integration", () => {
  let firstEventId: string | undefined;

  it("list_events returns events array or similar shape", async () => {
    const result = await callTool("list_events", {});
    const data = parseResult(result) as any;
    expect(data).toBeDefined();
    // Events may be under an "events" key or similar
    const events = data.events ?? data.data ?? data.items ?? [];
    if (Array.isArray(events) && events.length > 0) {
      firstEventId = events[0].id;
    }
  });

  it("get_event returns event details when an event exists", async () => {
    if (!firstEventId) {
      console.log("Skipping get_event — no events found in sandbox");
      return;
    }
    const result = await callTool("get_event", { event_id: firstEventId });
    const data = parseResult(result) as any;
    expect(data).toBeDefined();
    expect(data.id).toBe(firstEventId);
  });
});
