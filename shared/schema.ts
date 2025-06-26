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
  currency: varchar("currency").default("USD"),
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

// Appointments
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  providerId: integer("provider_id").notNull().references(() => providers.id),
  title: varchar("title").notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(), // HH:MM format
  duration: integer("duration").notNull(), // minutes
  type: varchar("type", { enum: ["video", "in_person"] }).notNull(),
  status: varchar("status", { enum: ["pending", "confirmed", "cancelled", "completed", "no_show"] }).default("pending"),
  meetingLink: varchar("meeting_link"),
  notes: text("notes"),
  cancelReason: text("cancel_reason"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: varchar("currency").default("USD"),
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
  appointments: many(appointments),
  availability: many(availability),
  blockedSlots: many(blockedSlots),
  reviews: many(reviews),
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
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
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
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
