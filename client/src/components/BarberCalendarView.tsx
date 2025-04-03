import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { AppointmentWithDetails, TimeSlot } from "@/types";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { addDays, format, isToday, startOfWeek, isSameDay, parseISO, addMinutes } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CalendarViewProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  appointments: AppointmentWithDetails[];
  isLoading: boolean;
  timeSlots: TimeSlot[];
  timeSlotsLoading: boolean;
  onBlockTime: (startTime: Date, endTime: Date) => void;
};

const BarberCalendarView = ({
  selectedDate,
  onDateChange,
  appointments,
  isLoading,
  timeSlots,
  timeSlotsLoading,
  onBlockTime,
}: CalendarViewProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [blockTimeDialogOpen, setBlockTimeDialogOpen] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState<Date | null>(null);
  const [blockEndTime, setBlockEndTime] = useState<Date | null>(null);

  // Business hours (9am to 6pm by default)
  const startHour = 9;
  const endHour = 18; // 6pm
  const intervalMinutes = 30; // 30-minute intervals

  // Generate time slots for the selected day
  const timeSlotRows = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, minute, 0, 0);
      
      // Skip if time is in the past
      if (new Date() > slotTime) continue;
      
      const slotEndTime = addMinutes(slotTime, intervalMinutes);
      
      // Check if this time slot is booked
      const isBooked = appointments.some(appointment => {
        const appointmentTime = new Date(appointment.date);
        return (
          appointmentTime >= slotTime && 
          appointmentTime < slotEndTime
        );
      });
      
      // Check if this time slot is blocked
      const isBlocked = timeSlots.some(slot => {
        const slotStartTime = new Date(slot.startTime);
        const slotEndTime = new Date(slot.endTime);
        return (
          (slotStartTime <= slotTime && slotEndTime > slotTime) ||
          (slotStartTime < slotEndTime && slotEndTime >= slotEndTime)
        );
      });
      
      // Find the appointment for this time slot (if any)
      const appointment = appointments.find(appointment => {
        const appointmentTime = new Date(appointment.date);
        return (
          appointmentTime >= slotTime && 
          appointmentTime < slotEndTime
        );
      });
      
      timeSlotRows.push({
        time: slotTime,
        endTime: slotEndTime,
        isBooked,
        isBlocked,
        appointment
      });
    }
  }

  const handleBlockTimeClick = (startTime: Date) => {
    setBlockStartTime(startTime);
    setBlockEndTime(addMinutes(startTime, 60)); // Default 1 hour block
    setBlockTimeDialogOpen(true);
  };

  const handleBlockTimeSubmit = () => {
    if (blockStartTime && blockEndTime) {
      onBlockTime(blockStartTime, blockEndTime);
      setBlockTimeDialogOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a start and end time",
      });
    }
  };

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-6">
      {/* Left side - Calendar picker */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
            <div className="mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Partially Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Fully Booked</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Time slots */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {isToday(selectedDate) ? "Today" : formatDate(selectedDate)}
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Block Off Time</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Block Off Time</DialogTitle>
                  <DialogDescription>
                    Block off time in your schedule for personal appointments, breaks, etc.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Date</label>
                      <div className="text-sm py-2">
                        {formatDate(selectedDate)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Start Time</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={blockStartTime?.toISOString() || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const time = new Date(e.target.value);
                            setBlockStartTime(time);
                            // Ensure end time is at least 30 mins after start time
                            if (blockEndTime && blockEndTime <= time) {
                              setBlockEndTime(addMinutes(time, 30));
                            }
                          }
                        }}
                      >
                        {timeSlotRows
                          .filter(slot => !slot.isBooked && !slot.isBlocked)
                          .map((slot, i) => (
                            <option key={i} value={slot.time.toISOString()}>
                              {format(slot.time, 'h:mm a')}
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">End Time</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={blockEndTime?.toISOString() || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setBlockEndTime(new Date(e.target.value));
                          }
                        }}
                      >
                        {timeSlotRows
                          .filter(slot => 
                            blockStartTime && 
                            slot.time > blockStartTime && 
                            !slot.isBooked && 
                            !slot.isBlocked
                          )
                          .map((slot, i) => (
                            <option key={i} value={slot.time.toISOString()}>
                              {format(slot.time, 'h:mm a')}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBlockTimeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBlockTimeSubmit}>
                    Block Time
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || timeSlotsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : timeSlotRows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No available time slots for this day.
            </div>
          ) : (
            <div className="space-y-2">
              {timeSlotRows.map((slot, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center p-3 rounded-md border",
                    slot.isBooked ? "bg-blue-50 border-blue-200" : 
                    slot.isBlocked ? "bg-gray-100 border-gray-200" : "bg-green-50 border-green-200 hover:border-green-300"
                  )}
                >
                  <div className="w-16 font-medium">
                    {format(slot.time, 'h:mm a')}
                  </div>
                  
                  {slot.isBooked && slot.appointment ? (
                    <div className="ml-4 flex-1">
                      <div className="font-medium">{slot.appointment.user.fullName}</div>
                      <div className="text-sm text-gray-500">
                        {slot.appointment.service.name} ({slot.appointment.service.duration} min)
                      </div>
                    </div>
                  ) : slot.isBlocked ? (
                    <div className="ml-4 flex-1 text-gray-500">
                      Blocked
                    </div>
                  ) : (
                    <div className="ml-4 flex-1 flex justify-between items-center">
                      <span className="text-gray-500">Available</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBlockTimeClick(slot.time)}
                      >
                        Block
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BarberCalendarView;