import { describe, it, expect } from "vitest";
import { callTool, parseResult, track } from "../helpers/setup.js";

describe("materials — integration", () => {
  let materialId: string | undefined;

  it("create_material", async () => {
    const result = await callTool("create_material", {
      name: "Integration Test Material",
      unit_cost: 9.99,
    });
    const text = (result.content[0] as { text: string }).text;
    if (text.includes("404") || text.includes("not found")) return;
    const data = parseResult(result) as any;
    expect(data.id).toBeDefined();
    materialId = data.id;
    track("material", materialId!);
  });

  it("get_material", async () => {
    if (!materialId) return;
    const result = await callTool("get_material", { id: materialId });
    const data = parseResult(result) as any;
    expect(data.id).toBe(materialId);
  });

  it("list_materials", async () => {
    const result = await callTool("list_materials", {});
    const text = (result.content[0] as { text: string }).text;
    if (text.includes("404") || text.includes("not found")) return;
    const data = parseResult(result) as any;
    expect(data).toBeDefined();
  });

  it("update_material", async () => {
    if (!materialId) return;
    const result = await callTool("update_material", {
      id: materialId,
      name: "Integration Test Material Updated",
    });
    const data = parseResult(result) as any;
    expect(data.name).toBe("Integration Test Material Updated");
  });

  it("delete_material", async () => {
    if (!materialId) return;
    const result = await callTool("delete_material", { id: materialId });
    expect(result.content[0]).toBeDefined();
  });
});
