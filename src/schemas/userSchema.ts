import { z } from "zod";

  const messageSchema = z.object({
    message: z.string().min(6, "Message is required"),
  });
  // Add Zod schema for user data validation
  const userSchema = z.object({
    userName: z.string().min(3, "Name is required"),
    userEmail: z.string().email("Invalid email address"),
  });

  export { messageSchema, userSchema };
