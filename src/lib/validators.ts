import { z } from "zod";

// ─── Auth Validators ────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Resident Validators ────────────────────────────────────
export const residentSchema = z.object({
  barangay_id: z.string().uuid("Please select a barangay"),
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().nullable().optional(),
  last_name: z.string().min(1, "Last name is required"),
  suffix: z.string().nullable().optional(),
  sex: z.enum(["Male", "Female"], {
    required_error: "Please select sex",
  }),
  birthdate: z.string().min(1, "Birthdate is required"),
  civil_status: z
    .enum(["Single", "Married", "Widowed", "Separated", "Divorced"])
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  occupation: z.string().nullable().optional(),
  contact_no: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional().or(z.literal("").transform(() => null)),
  voter_status: z.boolean().default(false),
  blood_type: z.string().nullable().optional(),
  nationality: z.string().default("Filipino"),
  religion: z.string().nullable().optional(),
  is_pwd: z.boolean().default(false),
  is_4ps_member: z.boolean().default(false),
  household_id: z.string().uuid().nullable().optional().or(z.literal("").transform(() => null)),
  status: z.enum(["active", "deceased", "migrated"]).default("active"),
  consent_given: z.boolean().default(false),
  consent_date: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  consent_purpose: z.string().nullable().optional(),
});

export type ResidentFormData = z.infer<typeof residentSchema>;

// ─── Household Validators ───────────────────────────────────
export const householdSchema = z.object({
  barangay_id: z.string().uuid("Please select a barangay"),
  address: z.string().min(1, "Address is required"),
  head_resident_id: z.string().uuid().nullable().optional().or(z.literal("").transform(() => null)),
  house_type: z.enum(["owned", "rented", "informal"]).nullable().optional().or(z.literal("").transform(() => null)),
});

export type HouseholdFormData = z.infer<typeof householdSchema>;

// ─── Social Development Validators ────────────────────────────

const numericPreprocess = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  }, schema);

export const educationSchema = z.object({
  resident_id: z.string().uuid("Please select a resident"),
  school_level: z.string().min(1, "School level is required"),
  school_name: z.string().nullable().optional(),
  school_year: z.string().nullable().optional(),
  enrollment_status: z.string().nullable().optional(),
});

export type EducationFormData = z.infer<typeof educationSchema>;

export const healthSchema = z.object({
  resident_id: z.string().uuid("Please select a resident"),
  bmi: numericPreprocess(z.number().nullable().optional()),
  nutritional_status: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  pregnancy_status: z.boolean().default(false),
  expected_delivery_date: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  maternal_case: z.string().nullable().optional(),
  disability_type: z.string().nullable().optional(),
  health_condition: z.string().nullable().optional(),
  vaccination_status: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  year_recorded: numericPreprocess(z.number().nullable().optional()),
});

export type HealthFormData = z.infer<typeof healthSchema>;

export const soloParentSchema = z.object({
  resident_id: z.string().uuid("Please select a resident"),
  registration_date: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  solo_parent_id_no: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  classification: z.string().nullable().optional(),
  number_of_dependents: numericPreprocess(z.number().nullable().optional()),
});

export type SoloParentFormData = z.infer<typeof soloParentSchema>;

// ─── Economic Development Validators ──────────────────────────

export const employmentSchema = z.object({
  resident_id: z.string().uuid("Please select a resident"),
  employment_status: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  employer: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  monthly_income: numericPreprocess(z.number().nullable().optional()),
  employment_type: z.string().nullable().optional().or(z.literal("").transform(() => null)),
});

export type EmploymentFormData = z.infer<typeof employmentSchema>;

export const farmerSchema = z.object({
  resident_id: z.string().uuid("Please select a resident"),
  rsbsa_no: z.string().nullable().optional(),
  farm_type: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  farm_area_hectares: numericPreprocess(z.number().nullable().optional()),
  land_ownership: z.string().nullable().optional(),
});

export type FarmerFormData = z.infer<typeof farmerSchema>;

export const fisherfolkSchema = z.object({
  resident_id: z.string().uuid("Please select a resident"),
  fishr_no: z.string().nullable().optional(),
  fishing_type: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  boat_owner: z.boolean().default(false),
  gear_type: z.string().nullable().optional(),
});

export type FisherfolkFormData = z.infer<typeof fisherfolkSchema>;

export const businessOwnerSchema = z.object({
  resident_id: z.string().uuid("Please select a resident"),
  business_name: z.string().min(1, "Business name is required"),
  business_type: z.string().min(1, "Business type is required"),
  registration_no: z.string().nullable().optional(),
  permit_no: z.string().nullable().optional(),
  capitalization: numericPreprocess(z.number().nullable().optional()),
  number_of_employees: numericPreprocess(z.number().nullable().optional()),
  status: z.enum(["active", "inactive", "closed"]).default("active"),
});

export type BusinessOwnerFormData = z.infer<typeof businessOwnerSchema>;

export const informalWorkerSchema = z.object({
  resident_id: z.string().uuid("Please select a resident"),
  sector_type: z.string().nullable().optional().or(z.literal("").transform(() => null)),
  location: z.string().nullable().optional(),
  estimated_daily_income: numericPreprocess(z.number().nullable().optional()),
});

export type InformalWorkerFormData = z.infer<typeof informalWorkerSchema>;
