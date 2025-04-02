import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Service, Barber, BookingFormData, TimeSlot } from "@/types";
import { formatPrice, formatDate, parseTimeSlot } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import ServiceCard from "@/components/ServiceCard";
import BarberCard from "@/components/BarberCard";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const BookingForm = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    service: null,
    barber: null,
    date: null,
    time: null,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingId, setBookingId] = useState<string>("");

  // Queries for services and barbers
  const servicesQuery = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const barbersQuery = useQuery<Barber[]>({
    queryKey: ['/api/barbers'],
  });

  // Query for time slots
  const timeSlotsQuery = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots', bookingData.barber?.id, selectedDate?.toISOString().split('T')[0]],
    enabled: !!bookingData.barber && !!selectedDate,
  });

  // Mutation for creating appointments
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: {
      userId: number;
      barberId: number;
      serviceId: number;
      date: Date;
      notes?: string;
    }) => {
      const res = await apiRequest('POST', '/api/appointments', appointmentData);
      return res.json();
    },
    onSuccess: (data) => {
      // Generate a random booking ID
      const randomId = 'BRB-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
      setBookingId(randomId);
      
      // Move to confirmation step
      setCurrentStep(5);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create appointment: ${error.message}`,
      });
    }
  });

  // Check if user is logged in before proceeding
  useEffect(() => {
    if (currentStep > 1 && !user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to book an appointment",
      });
      setLocation("/login");
    }
  }, [currentStep, user, setLocation, toast]);

  // Update progress bar
  const getProgressWidth = (step: number) => {
    return currentStep >= step ? "100%" : "0%";
  };

  // Handle service selection
  const handleSelectService = (service: Service) => {
    setBookingData(prev => ({ ...prev, service }));
  };

  // Handle barber selection
  const handleSelectBarber = (barber: Barber) => {
    setBookingData(prev => ({ ...prev, barber }));
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setBookingData(prev => ({ ...prev, date, time: null }));
    }
  };

  // Handle time slot selection
  const handleTimeSelect = (time: string) => {
    setBookingData(prev => ({ ...prev, time }));
  };

  // Check if can proceed to next step
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return !!bookingData.service;
      case 2: return !!bookingData.barber;
      case 3: return !!bookingData.date && !!bookingData.time;
      case 4: return true;
      default: return false;
    }
  };

  // Handle navigation between steps
  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Handle booking confirmation
  const handleConfirmBooking = () => {
    if (!user || !bookingData.service || !bookingData.barber || !bookingData.date || !bookingData.time) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing booking information",
      });
      return;
    }
    
    // Create appointment date by combining selected date and time
    const appointmentDate = new Date(bookingData.date);
    const [hours, minutes] = bookingData.time.split(':').map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    createAppointmentMutation.mutate({
      userId: user.id,
      barberId: bookingData.barber.id,
      serviceId: bookingData.service.id,
      date: appointmentDate,
      notes: bookingData.notes
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold text-primary">Book Your Appointment</h1>
      <p className="mt-2 text-lg text-gray-600">Select your preferred service, barber, and time slot.</p>

      <Card className="mt-8 overflow-hidden">
        <CardContent className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 1 ? 'bg-amber-600' : 'bg-gray-400'} text-white font-medium`}>1</div>
              <span className={`mt-2 text-sm font-medium ${currentStep >= 1 ? 'text-primary' : 'text-gray-500'}`}>Service</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-4">
              <div className="h-1 bg-amber-600 transition-all duration-300" style={{ width: getProgressWidth(2) }}></div>
            </div>
            <div className="flex flex-col items-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 2 ? 'bg-amber-600' : 'bg-gray-400'} text-white font-medium`}>2</div>
              <span className={`mt-2 text-sm font-medium ${currentStep >= 2 ? 'text-primary' : 'text-gray-500'}`}>Barber</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-4">
              <div className="h-1 bg-amber-600 transition-all duration-300" style={{ width: getProgressWidth(3) }}></div>
            </div>
            <div className="flex flex-col items-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 3 ? 'bg-amber-600' : 'bg-gray-400'} text-white font-medium`}>3</div>
              <span className={`mt-2 text-sm font-medium ${currentStep >= 3 ? 'text-primary' : 'text-gray-500'}`}>Date & Time</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-4">
              <div className="h-1 bg-amber-600 transition-all duration-300" style={{ width: getProgressWidth(4) }}></div>
            </div>
            <div className="flex flex-col items-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 4 ? 'bg-amber-600' : 'bg-gray-400'} text-white font-medium`}>4</div>
              <span className={`mt-2 text-sm font-medium ${currentStep >= 4 ? 'text-primary' : 'text-gray-500'}`}>Confirm</span>
            </div>
          </div>

          {/* Step 1: Select Service */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-xl font-bold text-primary mb-6">Select a Service</h3>
              
              {servicesQuery.isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : servicesQuery.isError ? (
                <p className="text-red-500">Error loading services: {servicesQuery.error.message}</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {servicesQuery.data.map((service: Service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isSelectable
                      isSelected={bookingData.service?.id === service.id}
                      onClick={() => handleSelectService(service)}
                    />
                  ))}
                </div>
              )}
              
              <div className="mt-8 flex justify-end">
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Barber */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-xl font-bold text-primary mb-6">Choose Your Barber</h3>
              
              {barbersQuery.isLoading ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2].map(i => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-1/3">
                          <Skeleton className="h-full min-h-40 w-full" />
                        </div>
                        <div className="sm:w-2/3 p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-4" />
                          <Skeleton className="h-10 w-32" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : barbersQuery.isError ? (
                <p className="text-red-500">Error loading barbers: {barbersQuery.error.message}</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {barbersQuery.data.map((barber: Barber) => (
                    <BarberCard
                      key={barber.id}
                      barber={barber}
                      isSelectable
                      isSelected={bookingData.barber?.id === barber.id}
                      onClick={() => handleSelectBarber(barber)}
                    />
                  ))}
                </div>
              )}
              
              <div className="mt-8 flex justify-between">
                <Button 
                  variant="outline"
                  onClick={handlePreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-xl font-bold text-primary mb-6">Select Date & Time</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select a Date</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      className="rounded-md border"
                      disabled={{ before: new Date() }}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
                  {!selectedDate ? (
                    <div className="text-center p-8 text-gray-500 border border-dashed rounded-lg">
                      Please select a date first
                    </div>
                  ) : timeSlotsQuery.isLoading ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : timeSlotsQuery.isError ? (
                    <p className="text-red-500">Error loading time slots: {timeSlotsQuery.error.message}</p>
                  ) : timeSlotsQuery.data.length === 0 ? (
                    <div className="text-center p-8 text-gray-500 border border-dashed rounded-lg">
                      No time slots available for this date
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {timeSlotsQuery.data
                        .filter((slot: TimeSlot) => !slot.isBooked)
                        .map((slot: TimeSlot) => {
                          const timeStr = parseTimeSlot(slot.startTime);
                          return (
                            <div 
                              key={slot.id}
                              className={`
                                text-center p-2 border rounded-md cursor-pointer
                                ${bookingData.time === timeStr
                                  ? 'border-2 border-amber-600 bg-amber-600 text-white'
                                  : 'border-gray-200 hover:border-amber-600'}
                              `}
                              onClick={() => handleTimeSelect(timeStr)}
                            >
                              <span className="font-medium">{timeStr}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                <Button 
                  variant="outline"
                  onClick={handlePreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm Booking */}
          {currentStep === 4 && (
            <div>
              <h3 className="text-xl font-bold text-primary mb-6">Confirm Your Booking</h3>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-medium text-primary">Booking Summary</h4>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{bookingData.service?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">{bookingData.service && formatPrice(bookingData.service.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{bookingData.service?.duration} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Barber:</span>
                    <span className="font-medium">{bookingData.barber?.user?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{bookingData.date && formatDate(bookingData.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{bookingData.time}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests (Optional)</label>
                  <Textarea 
                    rows={3} 
                    placeholder="Any special instructions for your barber..."
                    value={bookingData.notes || ''}
                    onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                <Button 
                  variant="outline"
                  onClick={handlePreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={handleConfirmBooking}
                  disabled={createAppointmentMutation.isPending}
                >
                  {createAppointmentMutation.isPending ? 'Processing...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          )}

          {/* Booking Confirmation */}
          {currentStep === 5 && (
            <div className="text-center py-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500">
                <Check className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-3 text-xl font-bold text-primary">Booking Confirmed!</h3>
              <p className="mt-2 text-gray-600">Your appointment has been successfully booked.</p>
              
              <div className="mt-6 bg-gray-50 p-6 rounded-lg text-left">
                <h4 className="font-medium text-primary">Booking Details</h4>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{bookingData.service?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Barber:</span>
                    <span className="font-medium">{bookingData.barber?.user?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium">
                      {bookingData.date && formatDate(bookingData.date)} at {bookingData.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-medium">{bookingId}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setLocation("/")}
                >
                  Return to Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingForm;
