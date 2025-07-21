import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import bcrypt from 'bcrypt';
import {
  users,
  services,
  barbers,
  appointments,
  timeSlots,
  type User,
  type Service,
  type Barber,
  type Appointment,
  type TimeSlot,
  type InsertUser,
  type InsertService,
  type InsertBarber,
  type InsertAppointment,
  type InsertTimeSlot
} from '@shared/schema';

export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Service operations
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;

  // Barber operations
  getBarbers(): Promise<Barber[]>;
  getBarber(id: number): Promise<Barber | undefined>;
  getBarberByUserId(userId: number): Promise<Barber | undefined>;
  createBarber(barber: InsertBarber): Promise<Barber>;

  // Appointment operations
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByUser(userId: number): Promise<Appointment[]>;
  getAppointmentsByBarber(barberId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  // Time slot operations
  getTimeSlots(barberId: number, date: Date): Promise<TimeSlot[]>;
  getTimeSlot(id: number): Promise<TimeSlot | undefined>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: number, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined>;
  deleteTimeSlot(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private _users: Map<number, User>;
  private _services: Map<number, Service>;
  private _barbers: Map<number, Barber>;
  private _appointments: Map<number, Appointment>;
  private _timeSlots: Map<number, TimeSlot>;

  private currentUserId: number;
  private currentServiceId: number;
  private currentBarberId: number;
  private currentAppointmentId: number;
  private currentTimeSlotId: number;

  constructor() {
    this._users = new Map();
    this._services = new Map();
    this._barbers = new Map();
    this._appointments = new Map();
    this._timeSlots = new Map();

    this.currentUserId = 1;
    this.currentServiceId = 1;
    this.currentBarberId = 1;
    this.currentAppointmentId = 1;
    this.currentTimeSlotId = 1;

    // Initialize with some default data
    // We can't await in constructor, but this is fine for MemStorage
    // as everything is synchronous in-memory operations
    this.seedData().catch(err => {
      console.error('Error seeding data:', err);
    });
  }

  // Seed initial data
  private async seedData() {
    // Add default services
    const services: InsertService[] = [
      // Men's services
      { name: 'Classic Haircut', type: 'haircut', description: 'Traditional haircut with precision styling and hot towel finish.', price: 2500, duration: 30, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80' },
      { name: 'Beard Trim', type: 'beard', description: 'Expert beard shaping and styling with essential oils treatment.', price: 1500, duration: 20, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80' },
      { name: 'Premium Package', type: 'combo', description: 'Complete grooming experience with haircut, beard trim, and facial.', price: 4500, duration: 60, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80' },

      // Women's services
      { name: 'Women\'s Haircut', type: 'womens-haircut', description: 'Professional women\'s haircut tailored to your face shape and personal style.', price: 3500, duration: 45, image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80' },
      { name: 'Blow Dry & Styling', type: 'womens-styling', description: 'Expert blow dry and styling to achieve your desired look for any occasion.', price: 2800, duration: 40, image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80' },
      { name: 'Hair Coloring', type: 'womens-color', description: 'Professional coloring service using premium products to achieve vibrant, long-lasting results.', price: 6500, duration: 90, image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80' }
    ];

    // Create services
    await Promise.all(services.map(service => this.createService(service)));

    // Add admin user
    const adminUser = await this.createUser({
      username: 'admin',
      email: 'admin@barbeshop.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password123
      role: 'admin',
      fullName: 'Admin User',
      phone: '+1234567890'
    });

    // Add barber users
    const marcoUser = await this.createUser({
      username: 'marco',
      email: 'marco@barbeshop.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password123
      role: 'barber',
      fullName: 'Marco Rossi',
      phone: '+1234567891'
    });

    await this.createBarber({
      userId: marcoUser.id,
      speciality: 'Master Barber',
      bio: 'With over 15 years of experience, Marco specializes in classic cuts and precision beard styling. His attention to detail ensures each client leaves looking their best.',
      image: 'https://images.unsplash.com/photo-1534368786749-b63e05c90863?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80'
    });

    const lucaUser = await this.createUser({
      username: 'luca',
      email: 'luca@barbeshop.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password123
      role: 'barber',
      fullName: 'Luca Bianchi',
      phone: '+1234567892'
    });

    await this.createBarber({
      userId: lucaUser.id,
      speciality: 'Style Specialist',
      bio: 'Luca brings modern techniques and trendy styles to our shop. His expertise in contemporary cuts and styling makes him a favorite for clients looking for the latest trends.',
      image: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80'
    });

    // Add regular user
    await this.createUser({
      username: 'customer',
      email: 'customer@example.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password123
      role: 'client',
      fullName: 'John Doe',
      phone: '+1234567893'
    });
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return Array.from(this._users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this._users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this._users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this._users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();

    // Ensure all required fields are provided with default values
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      role: insertUser.role || 'client',
      fullName: insertUser.fullName || null,
      phone: insertUser.phone || null,
      profileImage: insertUser.profileImage || null
    };

    this._users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this._users.set(id, updatedUser);
    return updatedUser;
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return Array.from(this._services.values());
  }

  async getService(id: number): Promise<Service | undefined> {
    return this._services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentServiceId++;

    // Ensure all required fields have values
    const service: Service = { 
      ...insertService, 
      id,
      description: insertService.description || null,
      image: insertService.image || null
    };

    this._services.set(id, service);
    return service;
  }

  // Barber operations
  async getBarbers(): Promise<Barber[]> {
    return Array.from(this._barbers.values());
  }

  async getBarber(id: number): Promise<Barber | undefined> {
    return this._barbers.get(id);
  }

  async getBarberByUserId(userId: number): Promise<Barber | undefined> {
    return Array.from(this._barbers.values()).find(barber => barber.userId === userId);
  }

  async createBarber(insertBarber: InsertBarber): Promise<Barber> {
    const id = this.currentBarberId++;

    // Ensure all required fields have values
    const barber: Barber = { 
      ...insertBarber, 
      id,
      userId: insertBarber.userId || null,
      speciality: insertBarber.speciality || null,
      bio: insertBarber.bio || null,
      image: insertBarber.image || null
    };

    this._barbers.set(id, barber);
    return barber;
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this._appointments.values());
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this._appointments.get(id);
  }

  async getAppointmentsByUser(userId: number): Promise<Appointment[]> {
    return Array.from(this._appointments.values()).filter(appointment => appointment.userId === userId);
  }

  async getAppointmentsByBarber(barberId: number): Promise<Appointment[]> {
    return Array.from(this._appointments.values()).filter(appointment => appointment.barberId === barberId);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const now = new Date();

    // Ensure all required fields have values
    const appointment: Appointment = { 
      ...insertAppointment, 
      id, 
      createdAt: now,
      status: insertAppointment.status || 'pending',
      notes: insertAppointment.notes || null
    };

    this._appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = await this.getAppointment(id);
    if (!appointment) return undefined;

    const updatedAppointment = { ...appointment, ...appointmentData };
    this._appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this._appointments.delete(id);
  }

  // Time slot operations
  async getTimeSlots(barberId: number, date: Date): Promise<TimeSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this._timeSlots.values()).filter(slot => 
      slot.barberId === barberId &&
      slot.startTime >= startOfDay &&
      slot.startTime <= endOfDay
    );
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    return this._timeSlots.get(id);
  }

  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = this.currentTimeSlotId++;

    // Ensure all required fields have values
    const timeSlot: TimeSlot = { 
      ...insertTimeSlot, 
      id,
      isBooked: insertTimeSlot.isBooked !== undefined ? insertTimeSlot.isBooked : false
    };

    this._timeSlots.set(id, timeSlot);
    return timeSlot;
  }

  async updateTimeSlot(id: number, timeSlotData: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const timeSlot = await this.getTimeSlot(id);
    if (!timeSlot) return undefined;

    const updatedTimeSlot = { ...timeSlot, ...timeSlotData };
    this._timeSlots.set(id, updatedTimeSlot);
    return updatedTimeSlot;
  }

  async deleteTimeSlot(id: number): Promise<boolean> {
    return this._timeSlots.delete(id);
  }
}

// DatabaseStorage implementation for PostgreSQL
export class DatabaseStorage implements IStorage {
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  // Barber operations
  async getBarbers(): Promise<Barber[]> {
    return await db.select().from(barbers);
  }

  async getBarber(id: number): Promise<Barber | undefined> {
    const [barber] = await db.select().from(barbers).where(eq(barbers.id, id));
    return barber || undefined;
  }

  async getBarberByUserId(userId: number): Promise<Barber | undefined> {
    const [barber] = await db.select().from(barbers).where(eq(barbers.userId, userId));
    return barber || undefined;
  }

  async createBarber(insertBarber: InsertBarber): Promise<Barber> {
    const [barber] = await db.insert(barbers).values(insertBarber).returning();
    return barber;
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async getAppointmentsByUser(userId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.userId, userId));
  }

  async getAppointmentsByBarber(barberId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.barberId, barberId));
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(insertAppointment).returning();
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment || undefined;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const [deletedAppointment] = await db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .returning();
    return !!deletedAppointment;
  }

  // Time slot operations
  async getTimeSlots(barberId: number, date: Date): Promise<TimeSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Use a single where condition with AND to filter by date range
    return await db
      .select()
      .from(timeSlots)
      .where(
        sql`${timeSlots.barberId} = ${barberId} AND 
            ${timeSlots.startTime} >= ${startOfDay} AND 
            ${timeSlots.startTime} <= ${endOfDay}`
      );
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    const [timeSlot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return timeSlot || undefined;
  }

  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const [timeSlot] = await db.insert(timeSlots).values(insertTimeSlot).returning();
    return timeSlot;
  }

  async updateTimeSlot(id: number, timeSlotData: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const [updatedTimeSlot] = await db
      .update(timeSlots)
      .set(timeSlotData)
      .where(eq(timeSlots.id, id))
      .returning();
    return updatedTimeSlot || undefined;
  }

  async deleteTimeSlot(id: number): Promise<boolean> {
    const [deletedTimeSlot] = await db
      .delete(timeSlots)
      .where(eq(timeSlots.id, id))
      .returning();
    return !!deletedTimeSlot;
  }

  // Method to seed initial data
  async seedData(): Promise<void> {
    try {
      // Check if we already have users
      const existingUsers = await db.select().from(users);
      if (existingUsers.length > 0) {
        console.log('Database already seeded, skipping seed operation');
        return;
      }

      console.log('Seeding database with initial data...');

      // Create admin user
      const hashedPassword = await bcrypt.hash("password123", 10);
      const adminUser = await this.createUser({
        username: 'admin',
        email: 'admin@barbershop.com',
        password: hashedPassword,
        role: 'admin',
        fullName: 'Admin User',
        phone: '555-123-4567'
      });

      // Create barber users
      const hashedPasswordBarber = await bcrypt.hash("password123", 10);
      const barber1 = await this.createUser({
        username: 'john',
        email: 'john@barbershop.com',
        password: hashedPasswordBarber,
        role: 'barber',
        fullName: 'John Smith',
        phone: '555-222-3333'
      });

      const barber2 = await this.createUser({
        username: 'sarah',
        email: 'sarah@barbershop.com',
        password: hashedPasswordBarber,
        role: 'barber',
        fullName: 'Sarah Johnson',
        phone: '555-444-5555'
      });

      // Create client user
      const hashedPasswordClient = await bcrypt.hash("password123", 10);
      const clientUser = await this.createUser({
        username: 'client',
        email: 'client@example.com',
        password: hashedPasswordClient,
        role: 'client',
        fullName: 'Test Client',
        phone: '555-777-8888'
      });

      // Create barber profiles
      const johnBarber = await this.createBarber({
        userId: barber1.id,
        speciality: 'Classic cuts, Fade specialist',
        bio: 'With over 10 years of experience, John specializes in classic men\'s cuts and fade techniques.',
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a'
      });

      const sarahBarber = await this.createBarber({
        userId: barber2.id,
        speciality: 'Modern styles, Women\'s cuts',
        bio: 'Sarah is passionate about creating modern, personalized styles for all clients.',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
      });

      // Create services
      await this.createService({
        name: 'Men\'s Haircut',
        type: 'haircut',
        description: 'Classic men\'s haircut with styling',
        price: 2500, // $25.00
        duration: 30,
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1'
      });

      await this.createService({
        name: 'Beard Trim',
        type: 'beard',
        description: 'Professional beard trimming and shaping',
        price: 1500, // $15.00
        duration: 20,
        image: 'https://images.unsplash.com/photo-1523433825-22da8853c13d'
      });

      await this.createService({
        name: 'Haircut & Beard Combo',
        type: 'combo',
        description: 'Full haircut and beard trim package',
        price: 3500, // $35.00
        duration: 45,
        image: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38'
      });

      await this.createService({
        name: 'Women\'s Haircut',
        type: 'womens-haircut',
        description: 'Women\'s haircut and styling',
        price: 4000, // $40.00
        duration: 45,
        image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df'
      });

      await this.createService({
        name: 'Women\'s Styling',
        type: 'womens-styling',
        description: 'Professional styling for any occasion',
        price: 3000, // $30.00
        duration: 30,
        image: 'https://images.unsplash.com/photo-1560343776-97e7d202ff0e'
      });

      await this.createService({
        name: 'Women\'s Color',
        type: 'womens-color',
        description: 'Professional hair coloring service',
        price: 7500, // $75.00
        duration: 120,
        image: 'https://images.unsplash.com/photo-1519356162478-a1526020abe1'
      });

      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
}

// Storage initialization with proper fallback
let storage: IStorage = new MemStorage(); // Default to in-memory storage

// Initialize storage asynchronously
const initializeStorage = async (): Promise<void> => {
  try {
    // Try to use PostgreSQL database first
    const dbStorage = new DatabaseStorage();
    await dbStorage.seedData();
    storage = dbStorage;
    console.log('Database storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database storage, using in-memory storage:', error);
    // storage is already initialized to MemStorage above
  }
};

// Auto-initialize storage
initializeStorage();

// Export getter function to access current storage instance
export const getStorage = (): IStorage => storage;

// Export storage directly for backwards compatibility
export { storage };