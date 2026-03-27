import { describe, it, expect } from "vitest";
import { callTool, parseResult, track } from "../helpers/setup.js";

describe("tags — integration", () => {
  const suffix = Date.now();
  let tagId: string;

  it("create_tag", async () => {
    const result = await callTool("create_tag", {
      name: `integration-test-tag-${suffix}`,
    });
    const data = parseResult(result) as any;
    expect(data.id).toBeDefined();
    tagId = data.id;
    track("tag", tagId);
  });

  it("list_tags — returns defined result", async () => {
    const result = await callTool("list_tags", {});
    const data = parseResult(result) as any;
    expect(data).toBeDefined();
    const tags = data.tags ?? data.data ?? data.items ?? [];
    expect(Array.isArray(tags)).toBe(true);
  });

  it("update_tag", async () => {
    const result = await callTool("update_tag", {
      tag_id: tagId,
      name: `integration-test-tag-updated-${suffix}`,
    });
    const data = parseResult(result) as any;
    expect(data.name).toBe(`integration-test-tag-updated-${suffix}`);
  });

  it("delete_tag", async () => {
    const result = await callTool("delete_tag", { tag_id: tagId });
    expect(result.content[0]).toBeDefined();
  });
});
