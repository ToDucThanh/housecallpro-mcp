import { z } from "zod";

export const isoDateTimeSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/,
  "Must be ISO 8601 format e.g. 2025-04-15T09:00:00"
);

export const uuidSchema = z.string().min(1, "ID cannot be empty");

export const phoneSchema = z.string().regex(
  /^[\+]?[\d\s\-\(\)]{7,15}$/,
  "Must be a valid phone number"
).optional();

export const paginationSchema = {
  page: z.number().int().min(1).optional().default(1),
  page_size: z.number().int().min(1).max(100).optional().default(10),
};

export const sortDirectionSchema = z.enum(["asc", "desc"]).optional();
