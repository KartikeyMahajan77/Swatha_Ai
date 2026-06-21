import { Appointment } from "@/lib/api/therapists";
import { format } from "date-fns";

export const getValidAppointmentStartDate = (appointment: Appointment) => {
  const sessionDate = appointment.startTime
    ? new Date(appointment.startTime)
    : null;
  const validDate =
    appointment.startTime && sessionDate && !Number.isNaN(sessionDate.getTime());

  return validDate ? sessionDate : null;
};

export const canStartAppointmentChat = (appointment: Appointment) => {
  if (appointment.status === "completed" || appointment.status === "cancelled") {
    return false;
  }

  const sessionDate = getValidAppointmentStartDate(appointment);
  if (!sessionDate) {
    return false;
  }

  const fiveMinutesEarlyMs = 5 * 60 * 1000;
  return Date.now() >= sessionDate.getTime() - fiveMinutesEarlyMs;
};

export const getAppointmentStartLabel = (appointment: Appointment) => {
  const sessionDate = getValidAppointmentStartDate(appointment);
  return sessionDate ? format(sessionDate, "PPP p") : "Session time unavailable";
};
