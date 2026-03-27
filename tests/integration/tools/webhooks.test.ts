import { describe, it, expect } from "vitest";
import { callTool } from "../helpers/setup.js";

describe("webhooks — integration", () => {
  it("create_webhook_subscription returns a result or a known not-available error", async () => {
    const result = await callTool("create_webhook_subscription", {
      url: "https://example.com/test-webhook",
    });
    const text = (result.content[0] as { text: string }).text;
    const isSuccess = text.startsWith("{") || text.startsWith("[");
    const isExpectedError = text.includes("404") || text.includes("422") || text.includes("not found") || text.includes("app");
    expect(isSuccess || isExpectedError).toBe(true);
  });
});
