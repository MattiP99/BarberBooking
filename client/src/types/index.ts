export type UserRole = 'client' | 'barber' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  profileImage?: string;
}

export interface Service {
  id: number;
  name: string;
  type: 'haircut' | 'beard' | 'combo';
  description?: string;
  price: number; // In cents
  duration: number; // In minutes
  image?: string;
}

export interface Barber {
  id: number;
  userId?: number;
  speciality?: string;
  bio?: string;
  image?: string;
  user?: User;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: number;
  userId: number;
  barberId: number;
  serviceId: number;
  date: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
}

export interface TimeSlot {
  id: number;
  barberId: number;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
}

export interface AppointmentWithDetails {
  id: number;
  date: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
  };
  barber: {
    id: number;
    name: string;
    speciality?: string;
    image?: string;
  };
  service: {
    id: number;
    name: string;
    price: number;
    duration: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
  phone?: string;
  role?: UserRole;
}

export interface BookingFormData {
  service: Service | null;
  barber: Barber | null;
  date: Date | null;
  time: string | null;
  notes?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}
