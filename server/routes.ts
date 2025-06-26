import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProviderSchema, insertAppointmentSchema, insertAvailabilitySchema, insertReviewSchema, insertServiceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get provider profile if user is a provider
      let provider = null;
      if (user.role === 'provider') {
        provider = await storage.getProviderByUserId(userId);
      }
      
      res.json({ ...user, provider });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user role
  app.patch('/api/auth/user/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['user', 'provider'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.upsertUser({ id: userId, role });
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Provider routes
  app.post('/api/providers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'provider') {
        return res.status(403).json({ message: "Only providers can create provider profiles" });
      }
      
      const providerData = insertProviderSchema.parse({ ...req.body, userId });
      const provider = await storage.createProvider(providerData);
      res.json(provider);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      }
      console.error("Error creating provider:", error);
      res.status(500).json({ message: "Failed to create provider" });
    }
  });

  app.get('/api/providers/search', async (req, res) => {
    try {
      const { category, location, minRating, videoCall, inPerson } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category as string;
      if (location) filters.location = location as string;
      if (minRating) filters.minRating = parseFloat(minRating as string);
      if (videoCall === 'true') filters.isVideoCallEnabled = true;
      if (inPerson === 'true') filters.isInPersonEnabled = true;
      
      const providers = await storage.searchProviders(filters);
      res.json(providers);
    } catch (error) {
      console.error("Error searching providers:", error);
      res.status(500).json({ message: "Failed to search providers" });
    }
  });

  app.get('/api/providers/featured', async (req, res) => {
    try {
      const providers = await storage.getFeaturedProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching featured providers:", error);
      res.status(500).json({ message: "Failed to fetch featured providers" });
    }
  });

  app.get('/api/providers/my-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = await storage.getProviderByUserId(userId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider profile not found" });
      }
      
      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider profile:", error);
      res.status(500).json({ message: "Failed to fetch provider profile" });
    }
  });

  app.get('/api/providers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const provider = await storage.getProvider(id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  app.put('/api/providers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const provider = await storage.getProvider(id);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this provider" });
      }
      
      const updates = insertProviderSchema.partial().parse(req.body);
      const updatedProvider = await storage.updateProvider(id, updates);
      res.json(updatedProvider);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      }
      console.error("Error updating provider:", error);
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  // Provider booking settings route
  app.put('/api/providers/:id/booking-settings', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const provider = await storage.getProvider(id);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this provider" });
      }
      
      const settings = req.body;
      
      // Validate booking settings
      if (settings.dailyCapacity && settings.dailyCapacity < 1) {
        return res.status(400).json({ message: "Daily capacity must be at least 1" });
      }
      if (settings.slotDuration && settings.slotDuration < 5) {
        return res.status(400).json({ message: "Slot duration must be at least 5 minutes" });
      }
      if (settings.bufferTime && settings.bufferTime < 0) {
        return res.status(400).json({ message: "Buffer time cannot be negative" });
      }
      
      const updatedProvider = await storage.updateProviderBookingSettings(id, settings);
      res.json(updatedProvider);
    } catch (error) {
      console.error("Error updating provider booking settings:", error);
      res.status(500).json({ message: "Failed to update booking settings" });
    }
  });

  // Provider availability routes
  app.get('/api/providers/:id/availability', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const availability = await storage.getProviderAvailability(id);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching provider availability:", error);
      res.status(500).json({ message: "Failed to fetch provider availability" });
    }
  });

  app.post('/api/providers/:id/availability', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const provider = await storage.getProvider(id);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this provider's availability" });
      }
      
      console.log("Received availability data:", JSON.stringify(req.body, null, 2));
      
      // Create a more flexible schema that only requires essential fields
      const availabilitySchema = z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        isAvailable: z.boolean(),
      });
      
      const schedule = z.array(availabilitySchema).parse(req.body);
      const scheduleWithProviderId = schedule.map(slot => ({ ...slot, providerId: id }));
      
      await storage.setProviderAvailability(id, scheduleWithProviderId);
      res.json({ message: "Availability updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid availability data", errors: error.errors });
      }
      console.error("Error updating provider availability:", error);
      res.status(500).json({ message: "Failed to update provider availability" });
    }
  });

  // Service management routes
  app.get('/api/providers/:providerId/services', async (req, res) => {
    try {
      const providerId = parseInt(req.params.providerId);
      const services = await storage.getProviderServices(providerId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching provider services:", error);
      res.status(500).json({ message: "Failed to fetch provider services" });
    }
  });

  app.post('/api/providers/:providerId/services', isAuthenticated, async (req: any, res) => {
    try {
      const providerId = parseInt(req.params.providerId);
      const userId = req.user.claims.sub;
      
      // Verify the provider belongs to the authenticated user
      const provider = await storage.getProvider(providerId);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to create services for this provider" });
      }
      
      const serviceData = { ...req.body, providerId };
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.get('/api/services/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.patch('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if the service exists and belongs to the user's provider
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      const provider = await storage.getProvider(service.providerId);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this service" });
      }
      
      const updates = req.body;
      const updatedService = await storage.updateService(id, updates);
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if the service exists and belongs to the user's provider
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      const provider = await storage.getProvider(service.providerId);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this service" });
      }
      
      await storage.deleteService(id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  app.patch('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get service and verify ownership
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      const provider = await storage.getProvider(service.providerId);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this service" });
      }
      
      const updatedService = await storage.updateService(id, req.body);
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Get service and verify ownership
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      const provider = await storage.getProvider(service.providerId);
      if (!provider || provider.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this service" });
      }
      
      await storage.deleteService(id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Walk-in appointment routes
  app.post('/api/appointments/walk-in', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verify user is a provider
      const provider = await storage.getProviderByUserId(userId);
      if (!provider) {
        return res.status(403).json({ message: "Only providers can create walk-in appointments" });
      }
      
      const appointment = await storage.createWalkInAppointment({
        ...req.body,
        providerId: provider.id
      });
      
      res.json(appointment);
    } catch (error) {
      console.error("Error creating walk-in appointment:", error);
      res.status(500).json({ message: "Failed to create walk-in appointment" });
    }
  });

  // Appointment routes
  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentData = insertAppointmentSchema.parse({ ...req.body, userId });
      
      // Check availability
      const isAvailable = await storage.checkSlotAvailability(
        appointmentData.providerId,
        appointmentData.scheduledDate.toISOString().split('T')[0],
        appointmentData.startTime,
        appointmentData.endTime
      );
      
      if (!isAvailable) {
        return res.status(409).json({ message: "Time slot is not available" });
      }
      
      const appointment = await storage.createAppointment(appointmentData);
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let appointments;
      if (user?.role === 'provider') {
        const provider = await storage.getProviderByUserId(userId);
        if (provider) {
          appointments = await storage.getProviderAppointments(provider.id);
        } else {
          appointments = [];
        }
      } else {
        appointments = await storage.getUserAppointments(userId);
      }
      
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get('/api/appointments/upcoming', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let appointments;
      if (user?.role === 'provider') {
        const provider = await storage.getProviderByUserId(userId);
        if (provider) {
          appointments = await storage.getUpcomingAppointments(provider.id.toString(), true);
        } else {
          appointments = [];
        }
      } else {
        appointments = await storage.getUpcomingAppointments(userId, false);
      }
      
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      res.status(500).json({ message: "Failed to fetch upcoming appointments" });
    }
  });

  app.patch('/api/appointments/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.user.claims.sub;
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Check authorization
      const user = await storage.getUser(userId);
      let authorized = false;
      
      if (appointment.userId === userId) {
        authorized = true;
      } else if (user?.role === 'provider') {
        const provider = await storage.getProviderByUserId(userId);
        if (provider && appointment.providerId === provider.id) {
          authorized = true;
        }
      }
      
      if (!authorized) {
        return res.status(403).json({ message: "Not authorized to update this appointment" });
      }
      
      const updatedAppointment = await storage.updateAppointmentStatus(id, status);
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ message: "Failed to update appointment status" });
    }
  });

  // Appointment priority routes
  app.patch('/api/appointments/:id/priority', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { priority } = req.body;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Only providers can set priority
      const user = await storage.getUser(userId);
      if (user?.role !== 'provider') {
        return res.status(403).json({ message: "Only providers can set appointment priority" });
      }

      const provider = await storage.getProviderByUserId(userId);
      if (!provider || appointment.providerId !== provider.id) {
        return res.status(403).json({ message: "Not authorized to modify this appointment" });
      }

      const updatedAppointment = await storage.updateAppointmentPriority(id, priority);
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error updating appointment priority:", error);
      res.status(500).json({ message: "Failed to update appointment priority" });
    }
  });

  // Payment status routes
  app.patch('/api/appointments/:id/payment', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { status, method } = req.body;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Check authorization - providers can update any payment for their appointments
      const user = await storage.getUser(userId);
      let authorized = false;
      
      if (appointment.userId === userId) {
        authorized = true;
      } else if (user?.role === 'provider') {
        const provider = await storage.getProviderByUserId(userId);
        if (provider && appointment.providerId === provider.id) {
          authorized = true;
        }
      }

      if (!authorized) {
        return res.status(403).json({ message: "Not authorized to update payment for this appointment" });
      }

      const updatedAppointment = await storage.updatePaymentStatus(id, status, method);
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Return visit waiver check
  app.get('/api/services/:serviceId/waiver-check', async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const { patientIdentifier } = req.query;

      if (!patientIdentifier) {
        return res.status(400).json({ message: "Patient identifier is required" });
      }

      const waiverCheck = await storage.checkReturnVisitWaiver(serviceId, patientIdentifier as string);
      res.json(waiverCheck);
    } catch (error) {
      console.error("Error checking return visit waiver:", error);
      res.status(500).json({ message: "Failed to check return visit waiver" });
    }
  });

  // Review routes
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({ ...req.body, userId });
      
      // Verify that the appointment exists and belongs to the user
      const appointment = await storage.getAppointment(reviewData.appointmentId);
      if (!appointment || appointment.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to review this appointment" });
      }
      
      if (appointment.status !== 'completed') {
        return res.status(400).json({ message: "Can only review completed appointments" });
      }
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get('/api/providers/:id/reviews', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reviews = await storage.getProviderReviews(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching provider reviews:", error);
      res.status(500).json({ message: "Failed to fetch provider reviews" });
    }
  });

  // Categories endpoint
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = [
        { id: 'healthcare', name: 'Healthcare', icon: 'fa-stethoscope', color: 'blue' },
        { id: 'legal', name: 'Legal Services', icon: 'fa-balance-scale', color: 'amber' },
        { id: 'education', name: 'Education & Tutoring', icon: 'fa-graduation-cap', color: 'emerald' },
        { id: 'business', name: 'Business Consulting', icon: 'fa-briefcase', color: 'purple' },
        { id: 'wellness', name: 'Wellness & Therapy', icon: 'fa-spa', color: 'pink' },
        { id: 'technology', name: 'Technology', icon: 'fa-laptop-code', color: 'indigo' },
      ];
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
