import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from './db';
import { IStorage } from './storage';
import { users, services, barbers, appointments, timeSlots } from '../shared/schema';
import type { User, Service, Barber, Appointment, TimeSlot } from '../shared/schema';
import type { InsertUser, InsertService, InsertBarber, InsertAppointment, InsertTimeSlot } from '../shared/schema';

export class PgStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await db.insert(users).values(insertUser).returning();
    return results[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const results = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const results = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return results[0];
  }

  async createService(insertService: InsertService): Promise<Service> {
    const results = await db.insert(services).values(insertService).returning();
    return results[0];
  }

  // Barber operations
  async getBarbers(): Promise<Barber[]> {
    return await db.select().from(barbers);
  }

  async getBarber(id: number): Promise<Barber | undefined> {
    const results = await db.select().from(barbers).where(eq(barbers.id, id)).limit(1);
    return results[0];
  }

  async getBarberByUserId(userId: number): Promise<Barber | undefined> {
    const results = await db.select().from(barbers).where(eq(barbers.userId, userId)).limit(1);
    return results[0];
  }

  async createBarber(insertBarber: InsertBarber): Promise<Barber> {
    const results = await db.insert(barbers).values(insertBarber).returning();
    return results[0];
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const results = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return results[0];
  }

  async getAppointmentsByUser(userId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.userId, userId));
  }

  async getAppointmentsByBarber(barberId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.barberId, barberId));
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const results = await db.insert(appointments).values(insertAppointment).returning();
    return results[0];
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const results = await db.update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, id))
      .returning();
    return results[0];
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const results = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    return results.length > 0;
  }

  // Time slot operations
  async getTimeSlots(barberId: number, date: Date): Promise<TimeSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.select().from(timeSlots)
      .where(
        and(
          eq(timeSlots.barberId, barberId),
          gte(timeSlots.startTime, startOfDay),
          lte(timeSlots.startTime, endOfDay)
        )
      );
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    const results = await db.select().from(timeSlots).where(eq(timeSlots.id, id)).limit(1);
    return results[0];
  }

  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const results = await db.insert(timeSlots).values(insertTimeSlot).returning();
    return results[0];
  }

  async updateTimeSlot(id: number, timeSlotData: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const results = await db.update(timeSlots)
      .set(timeSlotData)
      .where(eq(timeSlots.id, id))
      .returning();
    return results[0];
  }

  // Seed initial data (for testing)
  async seedData(): Promise<void> {
    // Check if there are any users already
    const existingUsers = await db.select({ count: users.id }).from(users);
    if (existingUsers.length > 0) {
      console.log('Data already seeded');
      return;
    }

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
    
    for (const service of services) {
      await this.createService(service);
    }
    
    // Add admin user
    const adminUser = await this.createUser({
      username: 'admin',
      email: 'admin@barbeshop.com',
      password: '$2b$10$QadQFjSmLJ3wV/utmJ7cBuqWbTOdfxz6ePZEA.bBXsIBx1s3BflN2', // password: admin123
      role: 'admin',
      fullName: 'Admin User',
      phone: '+1234567890'
    });
    
    // Add barber users
    const marcoUser = await this.createUser({
      username: 'marco',
      email: 'marco@barbeshop.com',
      password: '$2b$10$QadQFjSmLJ3wV/utmJ7cBuqWbTOdfxz6ePZEA.bBXsIBx1s3BflN2', // password: admin123
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
      password: '$2b$10$QadQFjSmLJ3wV/utmJ7cBuqWbTOdfxz6ePZEA.bBXsIBx1s3BflN2', // password: admin123
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
      password: '$2b$10$QadQFjSmLJ3wV/utmJ7cBuqWbTOdfxz6ePZEA.bBXsIBx1s3BflN2', // password: admin123
      role: 'client',
      fullName: 'John Doe',
      phone: '+1234567893'
    });

    console.log('Initial data seeded successfully');
  }
}