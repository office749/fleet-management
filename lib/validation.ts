import { z } from "zod";

/**
 * VIN validation: exactly 17 characters, letters + digits, and NO I, O, or Q
 * (those are disallowed in real VINs to avoid confusion with 1 and 0).
 */
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export function isValidVin(vin: string): boolean {
  return VIN_REGEX.test(vin.toUpperCase());
}

export const vinSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .refine((v) => v === "" || VIN_REGEX.test(v), {
    message: "VIN must be 17 characters and cannot contain I, O, or Q.",
  });

/** Threshold above which a one-week mileage jump is flagged for admin review. */
export const MILEAGE_JUMP_FLAG = 3500;

export const usStates = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
] as const;

export const vehicleSchema = z.object({
  label: z.string().trim().min(1, "A label like 'Truck 3' is required."),
  year: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal("").transform(() => undefined)),
  make: z.string().trim().optional(),
  model: z.string().trim().optional(),
  vin: vinSchema.optional().or(z.literal("")),
  licensePlate: z.string().trim().optional(),
  plateState: z.string().trim().optional(),
  status: z.enum(["active", "in_shop", "retired"]),
  insuranceCarrier: z.string().trim().optional(),
  insurancePolicyNumber: z.string().trim().optional(),
  insuranceExpiration: z.string().optional(),
  registrationExpiration: z.string().optional(),
  oilChangeIntervalMiles: z.coerce.number().int().positive().default(5000),
  tireCheckIntervalMiles: z.coerce.number().int().positive().default(50000),
});

export const mileageSchema = z.object({
  odometer: z.coerce
    .number({ invalid_type_error: "Enter the odometer number." })
    .int("Whole miles only.")
    .min(0, "Odometer can't be negative.")
    .max(2_000_000, "That number looks too large."),
});

export const issueSchema = z.object({
  category: z.string().trim().min(1, "Pick a category."),
  description: z.string().trim().min(3, "Add a short description."),
});

export const serviceSchema = z.object({
  vehicleId: z.string().min(1),
  serviceDate: z.string().min(1, "Pick a date."),
  type: z.enum(["oil_change", "tires", "brakes", "repair", "inspection", "other"]),
  odometer: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  vendor: z.string().trim().optional(),
  cost: z.string().trim().optional(), // dollars string, converted to cents server-side
  notes: z.string().trim().optional(),
});

/** Convert a dollars string like "123.45" or "$1,234" to integer cents. */
export function dollarsToCents(input: string | undefined | null): number | null {
  if (!input) return null;
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
