import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["user", "provider"] }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider profiles
export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: varchar("business_name"),
  category: varchar("category").notNull(),
  specialty: varchar("specialty"),
  bio: text("bio"),
  location: varchar("location"),
  address: text("address"),
  phone: varchar("phone"),
  website: varchar("website"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  currency: varchar("currency").default("INR"),
  experience: integer("experience"), // years
  isVideoCallEnabled: boolean("is_video_call_enabled").default(true),
  isInPersonEnabled: boolean("is_in_person_enabled").default(true),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  responseTime: integer("response_time").default(60), // minutes
  completedAppointments: integer("completed_appointments").default(0),
  rebookingRate: decimal("rebooking_rate", { precision: 5, scale: 2 }).default("0"),
  // Booking settings
  bookingType: varchar("booking_type", { enum: ["token", "timeslot", "service", "teleconsult"] }).default("timeslot"),
  dailyCapacity: integer("daily_capacity").default(20),
  slotDuration: integer("slot_duration").default(30), // minutes
  bufferTime: integer("buffer_time").default(10), // minutes
  autoEta: boolean("auto_eta").default(false), // for token flow
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider availability patterns (weekly schedule)
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(), // HH:MM format
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blocked dates/times for providers
export const blockedSlots = pgTable("blocked_slots", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id),
  date: timestamp("date").notNull(),
  startTime: varchar("start_time"),
  endTime: varchar("end_time"),
  reason: varchar("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Provider Services - Each provider can offer multiple services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providers.id),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // minutes
  bookingType: varchar("booking_type", { enum: ["token", "timeslot", "service", "teleconsult"] }).default("timeslot"),
  dailyCapacity: integer("daily_capacity").default(20),
  bufferTime: integer("buffer_time").default(10), // minutes
  availableDays: jsonb("available_days").notNull(), // [0,1,2,3,4,5,6] for Sun-Sat
  workingHours: jsonb("working_hours").notNull(), // {start: "09:00", end: "17:00"}
  paymentMode: varchar("payment_mode", { enum: ["online", "offline", "both"] }).default("both"),
  paymentPolicy: varchar("payment_policy", { enum: ["advance", "after", "optional"] }).default("advance"),
  waiveFeeOnReturn: boolean("waive_fee_on_return").default(false),
  waiverPeriodDays: integer("waiver_period_days").default(30),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments - Updated to support services and walk-ins
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  tokenId: varchar("token_id").notNull().unique(), // UUID or short code
  userId: varchar("user_id").references(() => users.id), // nullable for walk-ins
  providerId: integer("provider_id").notNull().references(() => providers.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  // Patient info (for both registered users and walk-ins)
  patientName: varchar("patient_name").notNull(),
  patientPhone: varchar("patient_phone").notNull(),
  patientEmail: varchar("patient_email"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(), // HH:MM format
  duration: integer("duration").notNull(), // minutes
  type: varchar("type", { enum: ["video", "in_person"] }).notNull(),
  source: varchar("source", { enum: ["online", "walk-in"] }).default("online"),
  status: varchar("status", { enum: ["pending", "confirmed", "cancelled", "completed", "no_show"] }).default("pending"),
  priority: boolean("priority").default(false),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  waived: boolean("waived").default(false),
  paymentStatus: varchar("payment_status", { enum: ["pending", "paid", "failed", "refunded"] }).default("pending"),
  paymentMethod: varchar("payment_method", { enum: ["online", "offline"] }),
  meetingLink: varchar("meeting_link"),
  notes: text("notes"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  providerId: integer("provider_id").notNull().references(() => providers.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  reviews: many(reviews),
  provider: many(providers),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.id],
  }),
  services: many(services),
  appointments: many(appointments),
  availability: many(availability),
  blockedSlots: many(blockedSlots),
  reviews: many(reviews),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  provider: one(providers, {
    fields: [services.providerId],
    references: [providers.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [appointments.providerId],
    references: [providers.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  review: one(reviews),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  provider: one(providers, {
    fields: [availability.providerId],
    references: [providers.id],
  }),
}));

export const blockedSlotsRelations = relations(blockedSlots, ({ one }) => ({
  provider: one(providers, {
    fields: [blockedSlots.providerId],
    references: [providers.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  appointment: one(appointments, {
    fields: [reviews.appointmentId],
    references: [appointments.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [reviews.providerId],
    references: [providers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProviderSchema = createInsertSchema(providers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  totalReviews: true,
  completedAppointments: true,
  rebookingRate: true,
}).extend({
  // Transform string inputs to proper types
  hourlyRate: z.union([z.string(), z.number()]).transform((val) => 
    typeof val === 'string' ? val : val.toString()
  ),
  experience: z.union([z.string(), z.number()]).transform((val) => 
    typeof val === 'string' ? parseInt(val) || 0 : val
  ).optional(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  tokenId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
