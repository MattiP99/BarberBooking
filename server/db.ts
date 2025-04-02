import pg from 'pg';
const { Pool } = pg;
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// Load environment variables
config();

// Create a connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the drizzle instance
export const db = drizzle(pool, { schema });

// Test the database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    client.release();
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    return false;
  }
}

// Initialize the database
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create schema and tables
    await client.query(`
      -- Create enum types
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('client', 'barber', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE service_type AS ENUM ('haircut', 'beard', 'combo', 'womens-haircut', 'womens-styling', 'womens-color');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Create tables
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'client',
        full_name TEXT,
        phone TEXT,
        profile_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type service_type NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS barbers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        speciality TEXT,
        bio TEXT,
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        barber_id INTEGER NOT NULL REFERENCES barbers(id),
        service_id INTEGER NOT NULL REFERENCES services(id),
        date TIMESTAMP NOT NULL,
        status appointment_status NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS time_slots (
        id SERIAL PRIMARY KEY,
        barber_id INTEGER NOT NULL REFERENCES barbers(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        is_booked BOOLEAN DEFAULT false
      );
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}