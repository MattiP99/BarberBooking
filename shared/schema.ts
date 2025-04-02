import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User role enumeration
export const userRoleEnum = pgEnum('user_role', ['client', 'barber', 'admin']);

// Services enumeration
export const serviceTypeEnum = pgEnum('service_type', ['haircut', 'beard', 'combo', 'womens-haircut', 'womens-styling', 'womens-color']);

// Appointment status enumeration
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending', 
  'confirmed', 
  'cancelled', 
  'completed'
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('client'),
  fullName: text("full_name"),
  phone: text("phone"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow()
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: serviceTypeEnum("type").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in cents
  duration: integer("duration").notNull(), // Duration in minutes
  image: text("image")
});

// Barbers table
export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Reference to users table
  speciality: text("speciality"),
  bio: text("bio"),
  image: text("image")
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  barberId: integer("barber_id").references(() => barbers.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  date: timestamp("date").notNull(),
  status: appointmentStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Available time slots table
export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").references(() => barbers.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBooked: boolean("is_booked").default(false)
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true
});

export const insertBarberSchema = createInsertSchema(barbers).omit({
  id: true
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true
});

// Create types from schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Barber = typeof barbers.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Registration schema with validation
export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export type RegisterCredentials = z.infer<typeof registerSchema>;

// Enhanced appointment type for client use
export const appointmentWithDetailsSchema = z.object({
  id: z.number(),
  date: z.date(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  notes: z.string().optional(),
  user: z.object({
    id: z.number(),
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string().optional()
  }),
  barber: z.object({
    id: z.number(),
    name: z.string(),
    speciality: z.string().optional(),
    image: z.string().optional()
  }),
  service: z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    duration: z.number()
  })
});

export type AppointmentWithDetails = z.infer<typeof appointmentWithDetailsSchema>;

// Define table relations
export const usersRelations = relations(users, ({ many, one }) => ({
  appointments: many(appointments),
  barber: one(barbers, {
    fields: [users.id],
    references: [barbers.userId],
  }),
}));

export const barbersRelations = relations(barbers, ({ one, many }) => ({
  user: one(users, {
    fields: [barbers.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  timeSlots: many(timeSlots),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  barber: one(barbers, {
    fields: [appointments.barberId],
    references: [barbers.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));

export const timeSlotsRelations = relations(timeSlots, ({ one }) => ({
  barber: one(barbers, {
    fields: [timeSlots.barberId],
    references: [barbers.id],
  }),
}));
