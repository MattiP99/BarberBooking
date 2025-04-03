import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppointmentWithDetails, AppointmentStatus } from "@/types";
import { formatDate, formatTime, formatPrice } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PendingAppointments = () => {
  const { toast } = useToast();
  
  // Query for fetching appointments
  const appointmentsQuery = useQuery({
    queryKey: ['/api/appointments'],
  });
  
  // Mutation for updating appointment status
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: AppointmentStatus }) => {
      const res = await apiRequest('PATCH', `/api/appointments/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: "Success",
        description: "Appointment status updated",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update appointment: ${error.message}`,
      });
    }
  });
  
  // Get only pending appointments and sort by date (earliest first)
  const pendingAppointments = appointmentsQuery.data
    ? (appointmentsQuery.data as AppointmentWithDetails[])
        .filter((appointment: AppointmentWithDetails) => appointment.status === 'pending')
        .sort((a: AppointmentWithDetails, b: AppointmentWithDetails) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        })
    : [];
  
  // Handle confirm appointment
  const handleConfirmAppointment = (id: number) => {
    updateAppointmentMutation.mutate({
      id,
      status: 'confirmed'
    });
  };
  
  // Handle cancel appointment
  const handleCancelAppointment = (id: number) => {
    updateAppointmentMutation.mutate({
      id,
      status: 'cancelled'
    });
  };
  
  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "?";
    
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Appointments</CardTitle>
        <CardDescription>
          Appointments awaiting your confirmation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointmentsQuery.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : appointmentsQuery.isError ? (
          <div className="text-center py-4 text-red-500">
            Error loading appointments: {appointmentsQuery.error.message}
          </div>
        ) : pendingAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending appointments
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAppointments.map((appointment: AppointmentWithDetails) => (
              <div 
                key={appointment.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center mb-4 sm:mb-0">
                  <Avatar className="h-10 w-10 bg-gray-300">
                    <AvatarFallback>{getUserInitials(appointment.user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="text-sm font-medium">{appointment.user.fullName}</div>
                    <div className="text-sm text-gray-500">{appointment.service.name} • {formatPrice(appointment.service.price)}</div>
                    <div className="text-sm font-medium mt-1">
                      {formatDate(new Date(appointment.date))} • {formatTime(new Date(appointment.date))}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => handleConfirmAppointment(appointment.id)}
                    disabled={updateAppointmentMutation.isPending}
                  >
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    Confirm
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none"
                        disabled={updateAppointmentMutation.isPending}
                      >
                        <XCircle className="mr-1 h-4 w-4 text-red-500" />
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this appointment with {appointment.user.fullName}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Yes, Cancel It
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingAppointments;