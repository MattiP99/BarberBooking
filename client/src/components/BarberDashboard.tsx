import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppointmentWithDetails, AppointmentStatus } from "@/types";
import { formatDate, formatTime, formatPrice } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, PlusCircle, X } from "lucide-react";

const BarberDashboard = () => {
  const { toast } = useToast();
  
  // State for filters
  const [filters, setFilters] = useState({
    date: null as Date | null,
    client: '',
    status: 'all' as AppointmentStatus | 'all',
  });
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // State for the appointment being edited
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithDetails | null>(null);
  
  // State for the appointment being deleted
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<number | null>(null);
  
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
      
      setEditingAppointment(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update appointment: ${error.message}`,
      });
    }
  });
  
  // Mutation for deleting appointment
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/appointments/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: "Success",
        description: "Appointment cancelled",
      });
      
      setDeletingAppointmentId(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to cancel appointment: ${error.message}`,
      });
    }
  });
  
  // Filter appointments based on the current filters
  const filteredAppointments = appointmentsQuery.data
    ? appointmentsQuery.data.filter((appointment: AppointmentWithDetails) => {
        // Apply date filter
        if (filters.date) {
          const appointmentDate = new Date(appointment.date);
          const filterDate = new Date(filters.date);
          
          if (
            appointmentDate.getDate() !== filterDate.getDate() ||
            appointmentDate.getMonth() !== filterDate.getMonth() ||
            appointmentDate.getFullYear() !== filterDate.getFullYear()
          ) {
            return false;
          }
        }
        
        // Apply client name filter
        if (filters.client && !appointment.user.fullName.toLowerCase().includes(filters.client.toLowerCase())) {
          return false;
        }
        
        // Apply status filter
        if (filters.status && filters.status !== 'all' && appointment.status !== filters.status) {
          return false;
        }
        
        return true;
      })
    : [];
  
  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const currentPageData = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle status update
  const handleStatusUpdate = (status: AppointmentStatus) => {
    if (editingAppointment) {
      updateAppointmentMutation.mutate({
        id: editingAppointment.id,
        status
      });
    }
  };
  
  // Handle appointment cancellation
  const handleCancelAppointment = () => {
    if (deletingAppointmentId) {
      deleteAppointmentMutation.mutate(deletingAppointmentId);
    }
  };
  
  // Get status badge classes
  const getStatusBadgeClasses = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      date: null,
      client: '',
      status: 'all',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-extrabold text-primary">Barber Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">Manage your appointments and schedule</p>
        </div>
        <div className="mt-4 flex md:mt-0">
          
        </div>
      </div>

      <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          {/* Filter Controls */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      {filters.date ? formatDate(filters.date) : 'Select Date'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Filter by Date</DialogTitle>
                    </DialogHeader>
                    <Calendar
                      mode="single"
                      selected={filters.date || undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, date }))}
                      className="rounded-md border"
                    />
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setFilters(prev => ({ ...prev, date: null }))}
                      >
                        Clear
                      </Button>
                      <Button onClick={() => {}}>Apply</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <Input
                  id="client-filter"
                  placeholder="Search by client name"
                  value={filters.client}
                  onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                  className="w-full sm:w-auto"
                />
              </div>
              <div>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as AppointmentStatus | 'all' }))}
                >
                  <SelectTrigger className="w-full sm:w-auto">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full sm:w-auto"
              >
                <Filter className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="mt-8 overflow-x-auto">
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
              <div className="text-center py-8 text-red-500">
                Error loading appointments: {appointmentsQuery.error.message}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No appointments found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPageData.map((appointment: AppointmentWithDetails) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 bg-gray-300">
                            <AvatarFallback>{getUserInitials(appointment.user.fullName)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{appointment.user.fullName}</div>
                            <div className="text-sm text-gray-500">{appointment.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{appointment.service.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatPrice(appointment.service.price)} • {appointment.service.duration} mins
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{formatDate(new Date(appointment.date))}</div>
                        <div className="text-sm text-gray-500">{formatTime(new Date(appointment.date))}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="link"
                              className="text-amber-600 hover:text-amber-700"
                              onClick={() => setEditingAppointment(appointment)}
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Appointment Status</DialogTitle>
                              <DialogDescription>
                                Change the status of the appointment for {editingAppointment?.user.fullName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm">Status:</label>
                                <Select
                                  value={editingAppointment?.status}
                                  onValueChange={(value) => {
                                    if (editingAppointment) {
                                      setEditingAppointment({
                                        ...editingAppointment,
                                        status: value as AppointmentStatus
                                      });
                                    }
                                  }}
                                  disabled={updateAppointmentMutation.isPending}
                                >
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setEditingAppointment(null)}
                                disabled={updateAppointmentMutation.isPending}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  if (editingAppointment) {
                                    handleStatusUpdate(editingAppointment.status);
                                  }
                                }}
                                disabled={updateAppointmentMutation.isPending}
                              >
                                {updateAppointmentMutation.isPending ? 'Updating...' : 'Update Status'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <span className="px-2 text-gray-300">|</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="link"
                              className="text-gray-600 hover:text-gray-900"
                              onClick={() => setDeletingAppointmentId(appointment.id)}
                            >
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this appointment? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel 
                                onClick={() => setDeletingAppointmentId(null)}
                                disabled={deleteAppointmentMutation.isPending}
                              >
                                No, keep appointment
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCancelAppointment}
                                disabled={deleteAppointmentMutation.isPending}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deleteAppointmentMutation.isPending ? 'Cancelling...' : 'Yes, cancel appointment'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {filteredAppointments.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredAppointments.length)}</span> to{" "}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAppointments.length)}</span> of{" "}
                <span className="font-medium">{filteredAppointments.length}</span> results
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(prev => Math.max(prev - 1, 1));
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(index + 1);
                        }}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarberDashboard;
