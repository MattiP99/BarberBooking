import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { User, RegisterCredentials } from "@/types";
import { apiRequest } from "./queryClient";

// Define auth context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

// Create auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("authToken");
      
      if (storedToken) {
        try {
          // Set token first
          setToken(storedToken);
          
          // Fetch user data
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
            credentials: "include",
          });
          
          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }
          
          const userData = await response.json();
          setUser(userData);
        } catch (err: any) {
          console.error("Error loading user:", err);
          // Clear invalid token
          localStorage.removeItem("authToken");
          setToken(null);
        }
      }
      
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      const data = await res.json();
      
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      
      // Update state
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (registerData: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest("POST", "/api/auth/register", registerData);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      const data = await res.json();
      
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      
      // Update state
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem("authToken");
    
    // Update state
    setToken(null);
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);