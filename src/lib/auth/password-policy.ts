import { z } from "zod";
export const passwordChecks = (password: string) => [
  { label: "At least 12 characters", valid: password.length >= 12 },
  { label: "Uppercase and lowercase letters", valid: /[a-z]/.test(password) && /[A-Z]/.test(password) },
  { label: "A number", valid: /\d/.test(password) },
  { label: "A special character", valid: /[^A-Za-z0-9]/.test(password) },
];
export const strongPassword = z.string().superRefine((value, ctx) => {
  if (passwordChecks(value).some(check => !check.valid)) ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Use at least 12 characters with upper and lowercase letters, a number and a symbol.",
  });
});
