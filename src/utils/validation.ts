import { z } from 'zod';

// Profile validation schemas
export const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username must be less than 20 characters" })
  .regex(/^[a-zA-Z0-9_-]+$/, { message: "Username can only contain letters, numbers, underscores, and hyphens" });

export const citySchema = z
  .string()
  .trim()
  .min(2, { message: "City must be at least 2 characters" })
  .max(50, { message: "City must be less than 50 characters" })
  .regex(/^[a-zA-Z\s-]+$/, { message: "City can only contain letters, spaces, and hyphens" });

export const countrySchema = z
  .string()
  .trim()
  .min(2, { message: "Country must be at least 2 characters" })
  .max(50, { message: "Country must be less than 50 characters" })
  .regex(/^[a-zA-Z\s-]+$/, { message: "Country can only contain letters, spaces, and hyphens" });

export const profileSchema = z.object({
  username: usernameSchema,
  city: citySchema,
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
export const validateProfileData = (data: { username: string; city: string; country: string }) => {
  try {
    const sanitized = {
      username: sanitizeInput(data.username),
      city: sanitizeInput(data.city),
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
