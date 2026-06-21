import { Appointment } from "@/lib/api/therapists";

export interface TherapyMessage {
  _id: string;
  appointmentId: string;
  senderId: string;
  senderRole: "patient" | "therapist";
  message: string;
  timestamp: string;
}

const readError = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data.message || data.error || fallback;
  } catch {
    return fallback;
  }
};

export const getAppointmentToken = (role: "patient" | "therapist") => {
  if (typeof window === "undefined") {
    return "";
  }

  return role === "patient"
    ? localStorage.getItem("token") || ""
    : localStorage.getItem("therapistToken") || "";
};

const headers = (role: "patient" | "therapist") => {
  const token = getAppointmentToken(role);
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

async function request<T>(
  url: string,
  options: RequestInit,
  fallback: string,
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(await readError(res, fallback));
  }
  return res.json();
}

export const getAppointmentDetails = (
  appointmentId: string,
  role: "patient" | "therapist",
) =>
  request<{ appointment: Appointment; canStart: boolean }>(
    `/api/appointments/${appointmentId}`,
    { headers: headers(role) },
    "Failed to load appointment",
  );

export const startAppointmentChat = (
  appointmentId: string,
  role: "patient" | "therapist",
) =>
  request<{ success: boolean; appointment: Appointment; roomId: string }>(
    `/api/appointments/${appointmentId}/start-chat`,
    { method: "POST", headers: headers(role) },
    "Failed to start chat",
  );

export const startTherapistSession = (appointmentId: string) =>
  request<{
    success: boolean;
    message: string;
    appointment: Appointment;
    roomId: string;
  }>(
    `/api/therapist/appointments/${appointmentId}/start-session`,
    { method: "POST", headers: headers("therapist") },
    "Failed to start session",
  );

export const joinAppointmentSession = (appointmentId: string) =>
  request<{ success: boolean; appointment: Appointment; roomId: string }>(
    `/api/appointments/${appointmentId}/join-session`,
    { method: "POST", headers: headers("patient") },
    "Failed to join session",
  );

export const getAppointmentMessages = (
  appointmentId: string,
  role: "patient" | "therapist",
) =>
  request<{ messages: TherapyMessage[] }>(
    `/api/appointments/${appointmentId}/messages`,
    { headers: headers(role) },
    "Failed to load messages",
  );

export const postAppointmentMessage = (
  appointmentId: string,
  role: "patient" | "therapist",
  message: string,
) =>
  request<{ message: TherapyMessage }>(
    `/api/appointments/${appointmentId}/messages`,
    {
      method: "POST",
      headers: headers(role),
      body: JSON.stringify({ message }),
    },
    "Failed to send message",
  );

export const endAppointmentSession = (
  appointmentId: string,
  role: "patient" | "therapist",
) =>
  request<{ success: boolean; appointment: Appointment; aiSummary: any }>(
    role === "therapist"
      ? `/api/therapist/appointments/${appointmentId}/end-session`
      : `/api/appointments/${appointmentId}/end-session`,
    { method: "POST", headers: headers(role) },
    "Failed to end session",
  );

export const getSocketUrl = () =>
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
