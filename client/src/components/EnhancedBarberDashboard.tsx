import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { AppointmentWithDetails, AppointmentStatus, TimeSlot } from "@/types";
import { useToast } from "@/hooks/use-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BarberCalendarView from "@/components/BarberCalendarView";
import PendingAppointments from "@/components/PendingAppointments";
import AddAppointmentForm from "@/components/AddAppointmentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

// Import original BarberDashboard for the appointments table view
import BarberDashboard from "@/components/BarberDashboard";

const EnhancedBarberDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false);

  const handleAddAppointment = () => {
    setIsAddAppointmentOpen(true);
  };

  const handleCloseAppointment = () => {
    setIsAddAppointmentOpen(false);
  };


  // Query for fetching appointments
  const appointmentsQuery = useQuery({
    queryKey: ['/api/appointments'],
  });

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

  // Query for fetching time slots
  const timeSlotsQuery = useQuery({
    queryKey: [
      '/api/time-slots', 
      barberQuery.data?.id, 
      selectedDate.toISOString().split('T')[0]
    ],
    queryFn: async () => {
      if (!barberQuery.data?.id) return [];

      const res = await apiRequest(
        'GET', 
        `/api/time-slots?barberId=${barberQuery.data.id}&date=${encodeURIComponent(selectedDate.toISOString().split('T')[0])}` 
      );
      return res.json();
    },
    enabled: !!user && !!barberQuery.data?.id
  });

  // Mutation for blocking time slots
  const blockTimeMutation = useMutation({
    mutationFn: async ({ startTime, endTime }: { startTime: Date, endTime: Date }) => {
      if (!user) throw new Error("User not authenticated");

      if (!barberQuery.data) throw new Error("Barber profile not found");

      // Create a new time slot
      const res = await apiRequest('POST', '/api/time-slots', {
        barberId: barberQuery.data.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isBooked: true
      });

      return res.json();
    },
    onSuccess: () => {
      // Invalidate with the specific query keys to refresh the time slots
      queryClient.invalidateQueries({ 
        queryKey: [
          '/api/time-slots', 
          barberQuery.data?.id, 
          selectedDate.toISOString().split('T')[0]
        ] 
      });

      toast({
        title: "Success",
        description: "Time slot blocked successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to block time slot: ${error.message}`,
      });
    }
  });

  const handleBlockTime = (startTime: Date, endTime: Date) => {
    blockTimeMutation.mutate({ startTime, endTime });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-extrabold text-primary">Barber Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">Manage your appointments and schedule</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={handleAddAppointment}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Add Walk-in Appointment
          </Button>
        </div>
      </div>

      {/* Add Appointment Form Dialog */}
      <AddAppointmentForm 
        isOpen={isAddAppointmentOpen} 
        onClose={handleCloseAppointment} 
      />

      <Tabs defaultValue="appointments" className="space-y-6">
        <div className="border-b">
          <TabsList className="w-full justify-start h-12">
            <TabsTrigger value="appointments" className="text-lg px-6">
              Appointments
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-lg px-6">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-lg px-6">
              Pending Requests
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="appointments" className="space-y-6">
          <BarberDashboard />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <BarberCalendarView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            appointments={(appointmentsQuery.data as AppointmentWithDetails[]) || []}
            isLoading={appointmentsQuery.isLoading}
            timeSlots={(timeSlotsQuery.data as TimeSlot[]) || []}
            timeSlotsLoading={timeSlotsQuery.isLoading}
            onBlockTime={handleBlockTime}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <PendingAppointments />

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
                <CardDescription>
                  Managing your appointments efficiently
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Responding to Requests</h3>
                  <p className="text-sm text-gray-500">
                    Try to respond to pending appointments within 24 hours to provide the best customer experience.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Blocking Time Off</h3>
                  <p className="text-sm text-gray-500">
                    Remember to block off time for breaks, meetings, or personal appointments in the Schedule tab.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-1">Preparing for Appointments</h3>
                  <p className="text-sm text-gray-500">
                    Review your confirmed appointments at the beginning of each day to prepare accordingly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedBarberDashboard;