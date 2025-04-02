import {
  users, User, InsertUser,
  services, Service, InsertService,
  barbers, Barber, InsertBarber,
  appointments, Appointment, InsertAppointment,
  timeSlots, TimeSlot, InsertTimeSlot
} from "@shared/schema";

export interface IStorage {
  // User operations
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
}

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
    this.seedData();
  }

  // Seed initial data
  private seedData() {
    // Add default services
    const services: InsertService[] = [
      { name: 'Classic Haircut', type: 'haircut', description: 'Traditional haircut with precision styling and hot towel finish.', price: 2500, duration: 30, image: 'https://images.unsplash.com/photo-1593702288056-f5924ad2c80c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80' },
      { name: 'Beard Trim', type: 'beard', description: 'Expert beard shaping and styling with essential oils treatment.', price: 1500, duration: 20, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80' },
      { name: 'Premium Package', type: 'combo', description: 'Complete grooming experience with haircut, beard trim, and facial.', price: 4500, duration: 60, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=400&q=80' }
    ];
    
    services.forEach(service => this.createService(service));
    
    // Add admin user
    this.createUser({
      username: 'admin',
      email: 'admin@barbeshop.com',
      password: '$2b$10$aDJN8XQpXrHLNkOI2EJ.puQcj9z6WoU1E/gLh37RXu5MSKoiPwfY2', // password: admin123
      role: 'admin',
      fullName: 'Admin User',
      phone: '+1234567890'
    });
    
    // Add barber users
    const marcoUser = this.createUser({
      username: 'marco',
      email: 'marco@barbeshop.com',
      password: '$2b$10$aDJN8XQpXrHLNkOI2EJ.puQcj9z6WoU1E/gLh37RXu5MSKoiPwfY2', // password: admin123
      role: 'barber',
      fullName: 'Marco Rossi',
      phone: '+1234567891'
    });
    
    this.createBarber({
      userId: marcoUser.id,
      speciality: 'Master Barber',
      bio: 'With over 15 years of experience, Marco specializes in classic cuts and precision beard styling. His attention to detail ensures each client leaves looking their best.',
      image: 'https://images.unsplash.com/photo-1534368786749-b63e05c90863?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80'
    });
    
    const lucaUser = this.createUser({
      username: 'luca',
      email: 'luca@barbeshop.com',
      password: '$2b$10$aDJN8XQpXrHLNkOI2EJ.puQcj9z6WoU1E/gLh37RXu5MSKoiPwfY2', // password: admin123
      role: 'barber',
      fullName: 'Luca Bianchi',
      phone: '+1234567892'
    });
    
    this.createBarber({
      userId: lucaUser.id,
      speciality: 'Style Specialist',
      bio: 'Luca brings modern techniques and trendy styles to our shop. His expertise in contemporary cuts and styling makes him a favorite for clients looking for the latest trends.',
      image: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80'
    });
    
    // Add regular user
    this.createUser({
      username: 'customer',
      email: 'customer@example.com',
      password: '$2b$10$aDJN8XQpXrHLNkOI2EJ.puQcj9z6WoU1E/gLh37RXu5MSKoiPwfY2', // password: admin123
      role: 'client',
      fullName: 'John Doe',
      phone: '+1234567893'
    });
  }

  // User operations
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
    const user: User = { ...insertUser, id, createdAt: now };
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
    const service: Service = { ...insertService, id };
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
    const barber: Barber = { ...insertBarber, id };
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
    const appointment: Appointment = { ...insertAppointment, id, createdAt: now };
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
    const timeSlot: TimeSlot = { ...insertTimeSlot, id };
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
}

export const storage = new MemStorage();
