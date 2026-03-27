import { describe, it, expect } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { client } from "../../src/client.js";

describe("client", () => {
  describe("request interceptor", () => {
    it("attaches an Authorization header to every request", async () => {
      let capturedHeader: string | undefined;
      const originalAdapter = client.defaults.adapter;

      // Custom adapter captures the final config after all request interceptors run
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        capturedHeader = config.headers["Authorization"] as string;
        return { data: {}, status: 200, statusText: "OK", headers: {}, config };
      };

      await client.get("/test");
      client.defaults.adapter = originalAdapter;

      expect(capturedHeader).toBeDefined();
      expect(capturedHeader).toMatch(/^(Token|Bearer) .+$/);
    });
  });

  describe("response error interceptor", () => {
    it("wraps API errors with status code and message", async () => {
      const originalAdapter = client.defaults.adapter;
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        const error = Object.assign(new Error("Request failed"), {
          response: { status: 422, data: { message: "Validation failed" } },
          config,
        });
        throw error;
      };

      let thrownError: Error | undefined;
      try {
        await client.get("/test");
      } catch (err) {
        thrownError = err as Error;
      }

      client.defaults.adapter = originalAdapter;
      expect(thrownError?.message).toBe("HousecallPro API error (422): Validation failed");
    });

    it("falls back to error.message when response has no body", async () => {
      const originalAdapter = client.defaults.adapter;
      client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        const error = Object.assign(new Error("Network Error"), {
          response: undefined,
          config,
        });
        throw error;
      };

      let thrownError: Error | undefined;
      try {
        await client.get("/test");
      } catch (err) {
        thrownError = err as Error;
      }

      client.defaults.adapter = originalAdapter;
      expect(thrownError?.message).toContain("HousecallPro API error (unknown): Network Error");
    });
  });
});
