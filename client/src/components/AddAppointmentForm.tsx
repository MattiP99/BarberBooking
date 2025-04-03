import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { format, parse, isValid, addMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2 } from "lucide-react";

interface AddAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddAppointmentForm = ({ isOpen, onClose }: AddAppointmentFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for the form
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [createNewUser, setCreateNewUser] = useState<boolean>(true);
  
  // Get barber for the current user
  const barberQuery = useQuery({
    queryKey: ['/api/barbers/by-user', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await apiRequest('GET', `/api/barbers/by-user/${user.id}`);
      return res.json();
    },
    enabled: !!user
  });
  
  // Get services
  const servicesQuery = useQuery({
    queryKey: ['/api/services'],
  });
  
  // Get users (clients) for dropdown
  const usersQuery = useQuery({
    queryKey: ['/api/users', 'clients'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users?role=client');
      return res.json();
    },
  });
  
  // Mutation for creating a new user (for walk-in clients)
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest('POST', '/api/users', userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: error.message || "An error occurred while creating the user",
      });
    }
  });
  
  // Mutation for creating a new appointment
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const res = await apiRequest('POST', '/api/appointments', appointmentData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment created",
        description: "The appointment has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to create appointment",
        description: error.message || "An error occurred while creating the appointment",
      });
    }
  });
  
  const resetForm = () => {
    setSelectedDate(new Date());
    setSelectedTime("09:00");
    setSelectedUserId("");
    setSelectedServiceId("");
    setNotes("");
    setFullName("");
    setEmail("");
    setPhone("");
    setCreateNewUser(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barberQuery.data?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Barber profile not found",
      });
      return;
    }
    
    if (!selectedServiceId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a service",
      });
      return;
    }
    
    // Parse the date and time
    const timeString = `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}`;
    const appointmentDateTime = parse(timeString, "yyyy-MM-dd'T'HH:mm", new Date());
    
    if (!isValid(appointmentDateTime)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid date or time",
      });
      return;
    }
    
    let userId;
    
    // Create new user for walk-in clients or use existing one
    if (createNewUser) {
      if (!fullName || !phone) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please provide client name and phone number",
        });
        return;
      }
      
      try {
        // Generate a unique username from name and timestamp
        const username = `${fullName.toLowerCase().replace(/\s+/g, ".")}_${Date.now()}`;
        const randomPassword = Math.random().toString(36).slice(-8);
        
        const userData = {
          username,
          fullName,
          email: email || `${username}@example.com`, // Fallback email if not provided
          phone,
          password: randomPassword,
          role: "client"
        };
        
        const newUser = await createUserMutation.mutateAsync(userData);
        userId = newUser.id;
      } catch (error) {
        // Error is already handled in mutation
        return;
      }
    } else {
      if (!selectedUserId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a client",
        });
        return;
      }
      
      userId = parseInt(selectedUserId);
    }
    
    // Create the appointment
    createAppointmentMutation.mutate({
      userId,
      barberId: barberQuery.data.id,
      serviceId: parseInt(selectedServiceId),
      date: appointmentDateTime.toISOString(),
      notes
    });
  };
  
  // Generate time slots from 9:00 AM to 8:00 PM in 30-minute intervals
  const generateTimeSlots = () => {
    const timeSlots = [];
    let current = parse("09:00", "HH:mm", new Date());
    const end = parse("20:00", "HH:mm", new Date());
    
    while (current <= end) {
      timeSlots.push(format(current, "HH:mm"));
      current = addMinutes(current, 30);
    }
    
    return timeSlots;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Appointment</DialogTitle>
          <DialogDescription>
            Create an appointment for a walk-in client or an existing customer.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientType">Client Type</Label>
              <Select
                value={createNewUser ? "new" : "existing"}
                onValueChange={(value) => setCreateNewUser(value === "new")}
              >
                <SelectTrigger id="clientType">
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Walk-in Client</SelectItem>
                  <SelectItem value="existing">Existing Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {createNewUser ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Client Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="userId">Select Client</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger id="userId">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersQuery.isLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : usersQuery.error ? (
                      <div className="p-2 text-red-500">Error loading clients</div>
                    ) : (
                      usersQuery.data?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName || user.username} {user.phone ? `(${user.phone})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select
                value={selectedServiceId}
                onValueChange={setSelectedServiceId}
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {servicesQuery.isLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : servicesQuery.error ? (
                    <div className="p-2 text-red-500">Error loading services</div>
                  ) : (
                    servicesQuery.data?.map((service: any) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} (${service.price})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Appointment Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border w-full"
                disabled={(date) => date < new Date()}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Appointment Time</Label>
              <Select
                value={selectedTime}
                onValueChange={setSelectedTime}
              >
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeSlots().map((time) => (
                    <SelectItem key={time} value={time}>
                      {format(parse(time, "HH:mm", new Date()), "h:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special requests or notes here"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createAppointmentMutation.isPending || createUserMutation.isPending}
            >
              {createAppointmentMutation.isPending || createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppointmentForm;