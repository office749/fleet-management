// Human-readable labels for enum values used across the UI.

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  oil_change: "Oil change",
  tires: "Tires",
  brakes: "Brakes",
  repair: "Repair",
  inspection: "Inspection",
  other: "Other",
};

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  in_shop: "In shop",
  retired: "Retired",
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  insurance: "Insurance",
  registration: "Registration",
  other: "Other",
};

export const ISSUE_CATEGORIES = [
  "Warning light",
  "Tires",
  "Brakes",
  "Fluids / leak",
  "Body damage",
  "Engine / noise",
  "Other",
] as const;
