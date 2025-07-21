import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import {
  insertUserSchema,
  loginSchema,
  insertAppointmentSchema,
  appointmentStatusEnum,
  User
} from "@shared/schema";

// Type augmentation for Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
    }
  }
}

// JWT token secret
const JWT_SECRET = process.env.JWT_SECRET || "barber-shop-secret-key";

// Middleware to authenticate JWT token
const authenticate = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Role-based middleware
const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {

  // API Routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Auth routes
  apiRouter.post("/auth/register", async (req, res) => {
    try {
      // Validate request body
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await getStorage().getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await getStorage().createUser({
        ...userData,
        password: hashedPassword
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      // Return user and token (excluding password)
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.post("/auth/login", async (req, res) => {
    try {
      console.log("Login attempt with data:", req.body);

      // Validate request body
      const credentials = loginSchema.parse(req.body);
      console.log("Credentials after validation:", credentials);

      // Find user by email
      const user = await getStorage().getUserByEmail(credentials.email);
      console.log("User found:", user ? "Yes" : "No");
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      console.log("Password valid:", isPasswordValid);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      // Return user data and token (excluding password)
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/auth/me", authenticate, async (req, res) => {
    try {
      const user = await getStorage().getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Services routes
  apiRouter.get("/services", async (req, res) => {
    try {
      const services = await getStorage().getServices();
      res.status(200).json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/services/:id", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }

      const service = await getStorage().getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.status(200).json(service);
    } catch (error) {
      console.error("Get service error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Barbers routes
  apiRouter.get("/barbers", async (req, res) => {
    try {
      const barbers = await getStorage().getBarbers();

      // For each barber, get the associated user data
      const barbersWithDetails = await Promise.all(barbers.map(async (barber) => {
        if (!barber.userId) return barber;

        const user = await getStorage().getUser(barber.userId);
        if (!user) return barber;

        const { password, ...userWithoutPassword } = user;
        return {
          ...barber,
          user: userWithoutPassword
        };
      }));

      res.status(200).json(barbersWithDetails);
    } catch (error) {
      console.error("Get barbers error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/barbers/:id", async (req, res) => {
    try {
      const barberId = parseInt(req.params.id);
      if (isNaN(barberId)) {
        return res.status(400).json({ message: "Invalid barber ID" });
      }

      const barber = await getStorage().getBarber(barberId);
      if (!barber) {
        return res.status(404).json({ message: "Barber not found" });
      }

      // Get the associated user data
      if (barber.userId) {
        const user = await getStorage().getUser(barber.userId);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json({
            ...barber,
            user: userWithoutPassword
          });
        }
      }

      res.status(200).json(barber);
    } catch (error) {
      console.error("Get barber error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Time slots routes
  apiRouter.get("/time-slots", async (req, res) => {
    try {
      const barberId = parseInt(req.query.barberId as string);
      const dateStr = req.query.date as string;

      if (isNaN(barberId)) {
        return res.status(400).json({ message: "Invalid barber ID" });
      }

      if (!dateStr) {
        return res.status(400).json({ message: "Date is required" });
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const timeSlots = await getStorage().getTimeSlots(barberId, date);

      // If no time slots found, generate time slots for the given date
      if (timeSlots.length === 0) {
        const generatedSlots = generateTimeSlots(barberId, date);

        for (const slot of generatedSlots) {
          await getStorage().createTimeSlot(slot);
        }

        const newTimeSlots = await getStorage().getTimeSlots(barberId, date);
        return res.status(200).json(newTimeSlots);
      }

      res.status(200).json(timeSlots);
    } catch (error) {
      console.error("Get time slots error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper function to generate time slots for a barber on a given date
  function generateTimeSlots(barberId: number, date: Date) {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(hour + 1, 0, 0, 0);

      slots.push({
        barberId,
        startTime,
        endTime,
        isBooked: false
      });
    }

    return slots;
  }

  // Appointments routes
  apiRouter.get("/appointments", authenticate, async (req, res) => {
    try {
      let appointments;

      // Determine which appointments to fetch based on user role
      if (req.user!.role === 'client') {
        // Clients can only see their own appointments
        appointments = await getStorage().getAppointmentsByUser(req.user!.id);
      } else if (req.user!.role === 'barber') {
        // Barbers can see appointments assigned to them
        const barber = await getStorage().getBarberByUserId(req.user!.id);
        if (!barber) {
          return res.status(404).json({ message: "Barber profile not found" });
        }
        appointments = await getStorage().getAppointmentsByBarber(barber.id);
      } else {
        // Admins can see all appointments
        appointments = await getStorage().getAppointments();
      }

      // Enhance appointments with user, barber, and service details
      const enhancedAppointments = await Promise.all(appointments.map(async (appointment) => {
        const [user, barber, service] = await Promise.all([
          getStorage().getUser(appointment.userId),
          getStorage().getBarber(appointment.barberId),
          getStorage().getService(appointment.serviceId)
        ]);

        if (!user || !barber || !service) {
          // Skip appointments with missing related data
          return null;
        }

        const barberUser = barber.userId ? await getStorage().getUser(barber.userId) : null;

        return {
          ...appointment,
          user: {
            id: user.id,
            fullName: user.fullName || user.username,
            email: user.email,
            phone: user.phone
          },
          barber: {
            id: barber.id,
            name: barberUser ? barberUser.fullName || barberUser.username : "Unknown",
            speciality: barber.speciality,
            image: barber.image
          },
          service: {
            id: service.id,
            name: service.name,
            price: service.price,
            duration: service.duration
          }
        };
      }));

      // Filter out null values (from appointments with missing related data)
      const validAppointments = enhancedAppointments.filter(Boolean);

      res.status(200).json(validAppointments);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.post("/appointments", authenticate, async (req, res) => {
    try {
      // Parse request body and handle date conversion
      // If the date is an ISO string, convert it to a Date object
      const rawData = req.body;

      if (typeof rawData.date === "string") {
        rawData.date = new Date(rawData.date);
        if (isNaN(rawData.date.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }

      // Validate the transformed request body
      const appointmentData = insertAppointmentSchema.parse(rawData);

      // Validate permissions based on role
      if (req.user!.role === 'client' && appointmentData.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only book appointments for yourself" });
      } else if (req.user!.role === 'barber') {
        // Barbers can create appointments but only for their own slots
        const barber = await getStorage().getBarberByUserId(req.user!.id);
        if (!barber || barber.id !== appointmentData.barberId) {
          return res.status(403).json({ message: "You can only create appointments for your own slots" });
        }
      }

      // Check if the service exists
      const service = await getStorage().getService(appointmentData.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Check if the barber exists
      const barber = await getStorage().getBarber(appointmentData.barberId);
      if (!barber) {
        return res.status(404).json({ message: "Barber not found" });
      }

      // Create the appointment
      const appointment = await getStorage().createAppointment(appointmentData);

      // Get user, barber, and service details for the response
      const [user, serviceDetails] = await Promise.all([
        getStorage().getUser(appointment.userId),
        getStorage().getService(appointment.serviceId)
      ]);

      if (!user || !serviceDetails) {
        return res.status(500).json({ message: "Failed to fetch appointment details" });
      }

      const barberUser = barber.userId ? await getStorage().getUser(barber.userId) : null;

      const enhancedAppointment = {
        ...appointment,
        user: {
          id: user.id,
          fullName: user.fullName || user.username,
          email: user.email,
          phone: user.phone
        },
        barber: {
          id: barber.id,
          name: barberUser ? barberUser.fullName || barberUser.username : "Unknown",
          speciality: barber.speciality,
          image: barber.image
        },
        service: {
          id: serviceDetails.id,
          name: serviceDetails.name,
          price: serviceDetails.price,
          duration: serviceDetails.duration
        }
      };

      res.status(201).json(enhancedAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Create appointment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.patch("/appointments/:id", authenticate, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }

      // Check if the appointment exists
      const appointment = await getStorage().getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Validate that the user has permission to update this appointment
      if (req.user!.role === 'client' && appointment.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only update your own appointments" });
      }

      if (req.user!.role === 'barber') {
        const barber = await getStorage().getBarberByUserId(req.user!.id);
        if (!barber || barber.id !== appointment.barberId) {
          return res.status(403).json({ message: "You can only update appointments assigned to you" });
        }
      }

      // Validate the status update if provided
      if (req.body.status) {
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        const validStatus = validStatuses.includes(req.body.status);
        if (!validStatus) {
          return res.status(400).json({ message: "Invalid appointment status" });
        }
      }

      // Update the appointment
      const updatedAppointment = await getStorage().updateAppointment(appointmentId, req.body);
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Failed to update appointment" });
      }

      // Get user, barber, and service details for the response
      const [user, barber, service] = await Promise.all([
        getStorage().getUser(updatedAppointment.userId),
        getStorage().getBarber(updatedAppointment.barberId),
        getStorage().getService(updatedAppointment.serviceId)
      ]);

      if (!user || !barber || !service) {
        return res.status(500).json({ message: "Failed to fetch appointment details" });
      }

      const barberUser = barber.userId ? await getStorage().getUser(barber.userId) : null;

      const enhancedAppointment = {
        ...updatedAppointment,
        user: {
          id: user.id,
          fullName: user.fullName || user.username,
          email: user.email,
          phone: user.phone
        },
        barber: {
          id: barber.id,
          name: barberUser ? barberUser.fullName || barberUser.username : "Unknown",
          speciality: barber.speciality,
          image: barber.image
        },
        service: {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration
        }
      };

      res.status(200).json(enhancedAppointment);
    } catch (error) {
      console.error("Update appointment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.delete("/appointments/:id", authenticate, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }

      // Check if the appointment exists
      const appointment = await getStorage().getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Validate that the user has permission to delete this appointment
      if (req.user!.role === 'client' && appointment.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own appointments" });
      }

      if (req.user!.role === 'barber') {
        const barber = await getStorage().getBarberByUserId(req.user!.id);
        if (!barber || barber.id !== appointment.barberId) {
          return res.status(403).json({ message: "You can only delete appointments assigned to you" });
        }
      }

      // Delete the appointment
      const success = await getStorage().deleteAppointment(appointmentId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete appointment" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete appointment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Time slots endpoints
  apiRouter.get("/time-slots", authenticate, async (req, res) => {
    try {
      const barberId = req.query.barberId ? parseInt(req.query.barberId as string) : undefined;
      const dateStr = req.query.date as string | undefined;

      if (!barberId) {
        return res.status(400).json({ message: "Barber ID is required" });
      }

      let date: Date;
      if (dateStr) {
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      } else {
        date = new Date();
      }

      const timeSlots = await getStorage().getTimeSlots(barberId, date);
      res.status(200).json(timeSlots);
    } catch (error) {
      console.error("Get time slots error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/time-slots/:id", authenticate, async (req, res) => {
    try {
      const timeSlotId = parseInt(req.params.id);
      if (isNaN(timeSlotId)) {
        return res.status(400).json({ message: "Invalid time slot ID" });
      }

      const timeSlot = await getStorage().getTimeSlot(timeSlotId);
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }

      res.status(200).json(timeSlot);
    } catch (error) {
      console.error("Get time slot error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.post("/time-slots", authenticate, async (req, res) => {
    try {
      // Validate that only barbers and admins can create time slots
      if (req.user!.role !== 'barber' && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Only barbers and admins can create time slots" });
      }

      const { barberId, startTime, endTime, isBooked } = req.body;

      if (!barberId || !startTime || !endTime) {
        return res.status(400).json({ message: "Barber ID, start time, and end time are required" });
      }

      // If the user is a barber, validate they can only create time slots for themselves
      if (req.user!.role === 'barber') {
        const barber = await getStorage().getBarberByUserId(req.user!.id);
        if (!barber || barber.id !== barberId) {
          return res.status(403).json({ message: "Barbers can only create time slots for themselves" });
        }
      }

      // Create the time slot
      const newTimeSlot = await getStorage().createTimeSlot({
        barberId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isBooked: isBooked || false
      });

      res.status(201).json(newTimeSlot);
    } catch (error) {
      console.error("Create time slot error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.patch("/time-slots/:id", authenticate, async (req, res) => {
    try {
      const timeSlotId = parseInt(req.params.id);
      if (isNaN(timeSlotId)) {
        return res.status(400).json({ message: "Invalid time slot ID" });
      }

      // Get the time slot
      const timeSlot = await getStorage().getTimeSlot(timeSlotId);
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }

      // Validate that only barbers and admins can update time slots
      if (req.user!.role !== 'barber' && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Only barbers and admins can update time slots" });
      }

      // If the user is a barber, validate they can only update their own time slots
      if (req.user!.role === 'barber') {
        const barber = await getStorage().getBarberByUserId(req.user!.id);
        if (!barber || barber.id !== timeSlot.barberId) {
          return res.status(403).json({ message: "Barbers can only update their own time slots" });
        }
      }

      const { startTime, endTime, isBooked } = req.body;

      // Update the time slot
      const updatedTimeSlot = await getStorage().updateTimeSlot(timeSlotId, {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        isBooked: isBooked !== undefined ? isBooked : undefined
      });

      if (!updatedTimeSlot) {
        return res.status(500).json({ message: "Failed to update time slot" });
      }

      res.status(200).json(updatedTimeSlot);
    } catch (error) {
      console.error("Update time slot error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete time slot endpoint
  apiRouter.delete("/time-slots/:id", authenticate, async (req, res) => {
    try {
      const timeSlotId = parseInt(req.params.id);
      if (isNaN(timeSlotId)) {
        return res.status(400).json({ message: "Invalid time slot ID" });
      }

      // Get the time slot
      const timeSlot = await getStorage().getTimeSlot(timeSlotId);
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }

      // Validate that only barbers and admins can delete time slots
      if (req.user!.role !== 'barber' && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Only barbers and admins can delete time slots" });
      }

      // If the user is a barber, validate they can only delete their own time slots
      if (req.user!.role === 'barber') {
        const barber = await getStorage().getBarberByUserId(req.user!.id);
        if (!barber || barber.id !== timeSlot.barberId) {
          return res.status(403).json({ message: "Barbers can only delete their own time slots" });
        }
      }

      // Check if there's an appointment using this time slot
      // For simplicity, we'll allow deletion of blocked slots only (is booked but with no appointment = manually blocked)
      if (!timeSlot.isBooked) {
        return res.status(400).json({ message: "This time slot is not blocked" });
      }

      // A real booked slot (with an appointment) shouldn't be deletable
      // Check if there's an appointment with this timeSlot's start time
      // Get appointments ONLY for this barber
      const appointments = await getStorage().getAppointmentsByBarber(timeSlot.barberId);

      // Add detailed logging for debugging
      console.log(`Checking if timeslot ${timeSlotId} can be deleted`);
      console.log(`Timeslot start time: ${timeSlot.startTime}`);

      const hasAppointment = appointments.some(appointment => {
        const appointmentDate = new Date(appointment.date);
        const timeSlotStartTime = new Date(timeSlot.startTime);

        // Only compare appointments for the exact same time
        const isSameTime = (
          appointmentDate.getFullYear() === timeSlotStartTime.getFullYear() &&
          appointmentDate.getMonth() === timeSlotStartTime.getMonth() &&
          appointmentDate.getDate() === timeSlotStartTime.getDate() &&
          appointmentDate.getHours() === timeSlotStartTime.getHours() &&
          appointmentDate.getMinutes() === timeSlotStartTime.getMinutes() &&
          appointment.barberId === timeSlot.barberId  // Ensure same barber
        );

        if (isSameTime) {
          console.log(`Found conflicting appointment: ${appointment.id} at ${appointmentDate}`);
        }

        return isSameTime;
      });

      if (hasAppointment) {
        return res.status(400).json({ message: "Cannot delete a time slot that has an appointment" });
      }

      // Delete the time slot
      const deleted = await getStorage().deleteTimeSlot(timeSlotId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete time slot" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete time slot error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint to get a barber by user ID
  apiRouter.get("/barbers/by-user/:userId", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const barber = await getStorage().getBarberByUserId(userId);
      if (!barber) {
        return res.status(404).json({ message: "Barber not found" });
      }

      res.status(200).json(barber);
    } catch (error) {
      console.error("Get barber by user ID error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint to get users by role (for barbers to select clients)
  apiRouter.get("/users", authenticate, async (req, res) => {
    try {
      // Only barbers and admins can access the list of users
      if (req.user!.role !== 'barber' && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to view user list" });
      }

      // Get users by role if specified
      const role = req.query.role as string | undefined;

      const users = await getStorage().getUsers();

      // Filter users by role if specified
      const filteredUsers = role 
        ? users.filter((user: User) => user.role === role)
        : users;

      // Remove passwords from response
      const usersWithoutPasswords = filteredUsers.map((user: User) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint to create a new user (for walk-in clients)
  apiRouter.post("/users", authenticate, async (req, res) => {
    try {
      // Only barbers and admins can create users
      if (req.user!.role !== 'barber' && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to create users" });
      }

      // Validate request body
      const userData = insertUserSchema.parse(req.body);

      // Check if user with the same email already exists
      if (userData.email) {
        const existingUser = await getStorage().getUserByEmail(userData.email);
        if (existingUser) {
          return res.status(400).json({ message: "User with this email already exists" });
        }
      }

      // Check if username already exists
      const existingUsername = await getStorage().getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await getStorage().createUser({
        ...userData,
        password: hashedPassword
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}