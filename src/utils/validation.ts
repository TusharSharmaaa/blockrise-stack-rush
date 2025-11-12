import { z } from 'zod';

// Profile validation schemas
export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: "Please enter your name." })
  .max(30, { message: "Name must be less than 30 characters" })
  .regex(/^[a-zA-Z0-9\s_-]+$/, { message: "Name can only contain letters, numbers, spaces, underscores, and hyphens" });

export const countrySchema = z
  .string()
  .trim()
  .min(2, { message: "Please select your country." });

export const profileSchema = z.object({
  name: nameSchema,
  country: countrySchema,
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Sanitize HTML to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

// Validate and sanitize profile data
export const validateProfileData = (data: { name: string; country: string }) => {
  try {
    const sanitized = {
      name: sanitizeInput(data.name),
      country: sanitizeInput(data.country),
    };
    
    return profileSchema.parse(sanitized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
};
