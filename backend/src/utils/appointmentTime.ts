export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !Number.isNaN(date.getTime());
};

const getDateOnly = (date: Date | string) => {
  if (date instanceof Date) {
    return date.toISOString().slice(0, 10);
  }

  return date.includes("T") ? date.slice(0, 10) : date;
};

export const combineDateAndTime = (date: Date | string, time: string) => {
  const dateOnly = getDateOnly(date);
  const normalizedTime = time?.length === 5 ? `${time}:00` : time;
  const parsedDate = new Date(`${dateOnly}T${normalizedTime || "00:00:00"}`);

  if (isValidDate(parsedDate)) {
    return parsedDate;
  }

  const baseDate = new Date(date);
  const [hours, minutes] = time.split(":").map(Number);
  baseDate.setHours(hours || 0, minutes || 0, 0, 0);
  return baseDate;
};

export const addMinutes = (date: Date, minutes: number) => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

export const canStartAppointment = (startTime?: Date) => {
  if (!startTime || !isValidDate(new Date(startTime))) {
    return false;
  }

  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEMO_ALLOW_EARLY_SESSION === "true"
  ) {
    return true;
  }

  const fiveMinutesEarlyMs = 5 * 60 * 1000;
  return Date.now() >= new Date(startTime).getTime() - fiveMinutesEarlyMs;
};

export const normalizeAppointmentTimes = async (appointment: any) => {
  if (!appointment) {
    return appointment;
  }

  const currentStartTime = appointment.startTime
    ? new Date(appointment.startTime)
    : null;
  const currentEndTime = appointment.endTime ? new Date(appointment.endTime) : null;
  let changed = false;

  if (!currentStartTime || !isValidDate(currentStartTime)) {
    if (appointment.date && appointment.time) {
      appointment.startTime = combineDateAndTime(appointment.date, appointment.time);
      changed = true;
    }
  }

  const normalizedStartTime = appointment.startTime
    ? new Date(appointment.startTime)
    : null;

  if (
    normalizedStartTime &&
    isValidDate(normalizedStartTime) &&
    (!currentEndTime || !isValidDate(currentEndTime))
  ) {
    appointment.endTime = addMinutes(
      normalizedStartTime,
      Number(appointment.durationMinutes || 60),
    );
    changed = true;
  }

  if (changed && typeof appointment.save === "function") {
    await appointment.save();
  }

  return appointment;
};

export const normalizeAppointments = async (appointments: any[]) => {
  return Promise.all(appointments.map((appointment) => normalizeAppointmentTimes(appointment)));
};
