import {
  users,
  providers,
  appointments,
  availability,
  blockedSlots,
  reviews,
  type User,
  type UpsertUser,
  type Provider,
  type InsertProvider,
  type Appointment,
  type InsertAppointment,
  type Availability,
  type InsertAvailability,
  type Review,
  type InsertReview,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Provider operations
  createProvider(provider: InsertProvider): Promise<Provider>;
  getProvider(id: number): Promise<Provider | undefined>;
  getProviderByUserId(userId: string): Promise<Provider | undefined>;
  updateProvider(id: number, updates: Partial<InsertProvider>): Promise<Provider>;
  updateProviderBookingSettings(providerId: number, settings: {
    bookingType?: "token" | "timeslot" | "service" | "teleconsult";
    dailyCapacity?: number;
    slotDuration?: number;
    bufferTime?: number;
    autoEta?: boolean;
  }): Promise<Provider>;
  searchProviders(filters: {
    category?: string;
    location?: string;
    minRating?: number;
    isVideoCallEnabled?: boolean;
    isInPersonEnabled?: boolean;
  }): Promise<Provider[]>;
  getFeaturedProviders(limit?: number): Promise<Provider[]>;
  
  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getUserAppointments(userId: string): Promise<Appointment[]>;
  getProviderAppointments(providerId: number): Promise<Appointment[]>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment>;
  getUpcomingAppointments(userId: string, isProvider?: boolean): Promise<Appointment[]>;
  
  // Availability operations
  setProviderAvailability(providerId: number, schedule: InsertAvailability[]): Promise<void>;
  getProviderAvailability(providerId: number): Promise<Availability[]>;
  checkSlotAvailability(providerId: number, date: string, startTime: string, endTime: string): Promise<boolean>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getProviderReviews(providerId: number): Promise<Review[]>;
  updateProviderRating(providerId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Provider operations
  async createProvider(provider: InsertProvider): Promise<Provider> {
    const [newProvider] = await db
      .insert(providers)
      .values(provider)
      .returning();
    return newProvider;
  }

  async getProvider(id: number): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider;
  }

  async getProviderByUserId(userId: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
    return provider;
  }

  async updateProvider(id: number, updates: Partial<InsertProvider>): Promise<Provider> {
    const [provider] = await db
      .update(providers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(providers.id, id))
      .returning();
    return provider;
  }

  async updateProviderBookingSettings(providerId: number, settings: {
    bookingType?: "token" | "timeslot" | "service" | "teleconsult";
    dailyCapacity?: number;
    slotDuration?: number;
    bufferTime?: number;
    autoEta?: boolean;
  }): Promise<Provider> {
    const [provider] = await db
      .update(providers)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(providers.id, providerId))
      .returning();
    return provider;
  }

  async searchProviders(filters: {
    category?: string;
    location?: string;
    minRating?: number;
    isVideoCallEnabled?: boolean;
    isInPersonEnabled?: boolean;
  }): Promise<Provider[]> {
    let query = db.select().from(providers).where(eq(providers.isActive, true));
    
    const conditions = [];
    
    if (filters.category) {
      conditions.push(eq(providers.category, filters.category));
    }
    
    if (filters.location) {
      conditions.push(ilike(providers.location, `%${filters.location}%`));
    }
    
    if (filters.minRating) {
      conditions.push(gte(providers.rating, filters.minRating.toString()));
    }
    
    if (filters.isVideoCallEnabled) {
      conditions.push(eq(providers.isVideoCallEnabled, true));
    }
    
    if (filters.isInPersonEnabled) {
      conditions.push(eq(providers.isInPersonEnabled, true));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(providers.rating), desc(providers.totalReviews));
  }

  async getFeaturedProviders(limit = 6): Promise<Provider[]> {
    return await db
      .select()
      .from(providers)
      .where(and(eq(providers.isActive, true), eq(providers.isVerified, true)))
      .orderBy(desc(providers.rating), desc(providers.totalReviews))
      .limit(limit);
  }

  // Appointment operations
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.scheduledDate));
  }

  async getProviderAppointments(providerId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.providerId, providerId))
      .orderBy(desc(appointments.scheduledDate));
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    const [appointment] = await db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async getUpcomingAppointments(userId: string, isProvider = false): Promise<Appointment[]> {
    const now = new Date();
    const field = isProvider ? appointments.providerId : appointments.userId;
    const value = isProvider ? parseInt(userId) : userId;
    
    return await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(field, value),
          gte(appointments.scheduledDate, now),
          inArray(appointments.status, ["pending", "confirmed"])
        )
      )
      .orderBy(asc(appointments.scheduledDate));
  }

  // Availability operations
  async setProviderAvailability(providerId: number, schedule: InsertAvailability[]): Promise<void> {
    // Delete existing availability
    await db.delete(availability).where(eq(availability.providerId, providerId));
    
    // Insert new availability
    if (schedule.length > 0) {
      await db.insert(availability).values(schedule);
    }
  }

  async getProviderAvailability(providerId: number): Promise<Availability[]> {
    return await db
      .select()
      .from(availability)
      .where(eq(availability.providerId, providerId))
      .orderBy(asc(availability.dayOfWeek), asc(availability.startTime));
  }

  async checkSlotAvailability(providerId: number, date: string, startTime: string, endTime: string): Promise<boolean> {
    // Check if there's an existing appointment in this slot
    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.providerId, providerId),
          eq(sql`DATE(${appointments.scheduledDate})`, date),
          // Check for time overlap
          sql`(${appointments.startTime} < ${endTime} AND ${appointments.endTime} > ${startTime})`,
          inArray(appointments.status, ["pending", "confirmed"])
        )
      );
    
    return existingAppointment.length === 0;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    
    // Update provider rating
    await this.updateProviderRating(review.providerId);
    
    return newReview;
  }

  async getProviderReviews(providerId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.providerId, providerId))
      .orderBy(desc(reviews.createdAt));
  }

  async updateProviderRating(providerId: number): Promise<void> {
    const reviewStats = await db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})`,
        totalReviews: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.providerId, providerId));

    if (reviewStats.length > 0 && reviewStats[0].totalReviews > 0) {
      await db
        .update(providers)
        .set({
          rating: reviewStats[0].avgRating.toString(),
          totalReviews: reviewStats[0].totalReviews,
          updatedAt: new Date(),
        })
        .where(eq(providers.id, providerId));
    }
  }
}

export const storage = new DatabaseStorage();
