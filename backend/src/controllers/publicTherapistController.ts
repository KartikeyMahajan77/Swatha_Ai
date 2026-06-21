import { Request, Response } from "express";
import { Therapist } from "../models/Therapist";
import { Appointment } from "../models/Appointment";
import {
  addMinutes,
  combineDateAndTime,
  normalizeAppointments,
  normalizeAppointmentTimes,
} from "../utils/appointmentTime";

const publicTherapistFields = "-password -phone";

export const getVerifiedTherapists = async (_req: Request, res: Response) => {
  const therapists = await Therapist.find({
    isVerified: true,
    verificationStatus: "verified",
  })
    .select(publicTherapistFields)
    .sort({ name: 1 });

  res.json({ therapists });
};

export const getTherapistById = async (req: Request, res: Response) => {
  const therapist = await Therapist.findOne({
    _id: req.params.therapistId,
    isVerified: true,
    verificationStatus: "verified",
  }).select(publicTherapistFields);

  if (!therapist) {
    return res.status(404).json({ message: "Therapist not found." });
  }

  res.json({ therapist });
};

export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const { date, time, durationMinutes, notes, availabilitySlotId } = req.body;

    if (!date || !time || !durationMinutes) {
      return res.status(400).json({ message: "Date, time, and duration are required." });
    }

    const therapist = await Therapist.findOne({
      _id: req.params.therapistId,
      isVerified: true,
      verificationStatus: "verified",
    });

    if (!therapist) {
      return res.status(404).json({ message: "Verified therapist not found." });
    }

    const slot = therapist.availability.find(
      (item: any) =>
        item._id.toString() === availabilitySlotId ||
        (new Date(item.date).toISOString().slice(0, 10) ===
          new Date(date).toISOString().slice(0, 10) &&
          item.startTime === time),
    );

    if (!slot || slot.isBooked) {
      return res.status(400).json({ message: "Selected slot is not available." });
    }

    const totalAmount = (Number(durationMinutes) / 60) * therapist.hourlyRate;
    const startTime = combineDateAndTime(date, time);
    const endTime = addMinutes(startTime, Number(durationMinutes));
    const appointment = await Appointment.create({
      patientId: req.user._id,
      therapistId: therapist._id,
      availabilitySlotId: slot._id,
      date: new Date(date),
      time,
      startTime,
      endTime,
      durationMinutes,
      hourlyRate: therapist.hourlyRate,
      totalAmount,
      notes,
    });

    slot.isBooked = true;
    await therapist.save();
    await normalizeAppointmentTimes(appointment);
    console.log("Appointment:", appointment);

    res.status(201).json({ appointment, message: "Appointment booked successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMyAppointments = async (req: Request, res: Response) => {
  const appointments = await Appointment.find({ patientId: req.user._id })
    .populate("therapistId", "name email specialization qualification hourlyRate")
    .sort({ startTime: 1, date: 1, time: 1 });

  const normalizedAppointments = await normalizeAppointments(appointments);
  console.log("Appointment:", normalizedAppointments);

  res.json({ appointments: normalizedAppointments });
};
