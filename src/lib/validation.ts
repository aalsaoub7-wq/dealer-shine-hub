import { z } from "zod";

// Swedish license plate format: ABC123 or ABC12D
const SWEDISH_LICENSE_PLATE_REGEX = /^[A-ZÅÄÖ]{3}\s?\d{2}[A-ZÅÄÖ0-9]$/i;

// Image validation constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
];

// Car schemas
export const addCarSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Bilens namn krävs")
    .max(100, "Bilens namn får vara max 100 tecken"),
  registration_number: z
    .string()
    .trim()
    .min(1, "Registreringsnummer krävs")
    .max(10, "Registreringsnummer får vara max 10 tecken")
    .regex(
      SWEDISH_LICENSE_PLATE_REGEX,
      "Ogiltigt registreringsnummer format (t.ex. ABC123 eller ABC12D)"
    ),
});

export const editCarSchema = z.object({
  name: z
    .string()
    .trim()
    .max(100, "Bilens namn får vara max 100 tecken")
    .optional(),
  registration_number: z
    .string()
    .trim()
    .max(10, "Registreringsnummer får vara max 10 tecken")
    .regex(
      SWEDISH_LICENSE_PLATE_REGEX,
      "Ogiltigt registreringsnummer format (t.ex. ABC123 eller ABC12D)"
    )
    .or(z.literal(""))
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, "Beskrivning får vara max 5000 tecken")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(2000, "Anteckningar får vara max 2000 tecken")
    .optional(),
  price: z
    .number()
    .positive("Priset måste vara ett positivt tal")
    .max(100000000, "Priset är för högt")
    .optional(),
  mileage: z
    .number()
    .nonnegative("Mätarställning kan inte vara negativ")
    .max(10000000, "Mätarställning är för hög")
    .optional(),
});

// Image validation
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Filtypen ${file.type} stöds inte. Tillåtna format: JPEG, PNG, WebP, HEIC/HEIF, AVIF`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Filen är för stor (${(file.size / 1024 / 1024).toFixed(2)}MB). Max storlek är ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
};

// Sanitize text input to prevent XSS
export const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

export type AddCarFormData = z.infer<typeof addCarSchema>;
export type EditCarFormData = z.infer<typeof editCarSchema>;
