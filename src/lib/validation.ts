import { z } from "zod";

export const resourceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.string().trim().min(2).max(60),
  location: z.string().trim().min(2).max(120),
  capacity: z.coerce.number().int().min(1).max(10000),
  description: z.string().trim().max(500).optional().nullable(),
});

export const reservationSchema = z.object({
  resourceId: z.string().min(1),
  requesterName: z.string().trim().min(2).max(100),
  requesterEmail: z.string().trim().email().max(254),
  purpose: z.string().trim().min(3).max(300),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
}).refine((data) => data.endAt > data.startAt, {
  message: "End time must be after start time",
  path: ["endAt"],
});
