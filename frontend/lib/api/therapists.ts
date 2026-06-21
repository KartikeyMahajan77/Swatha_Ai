export interface AvailabilitySlot {
  _id?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isBooked?: boolean;
}

export interface Therapist {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  hourlyRate: number;
  bio: string;
  certificateUrl?: string;
  isVerified: boolean;
  verificationStatus: "pending" | "verified" | "rejected";
  availability: AvailabilitySlot[];
}

export interface Appointment {
  _id: string;
  patientId: any;
  therapistId: any;
  availabilitySlotId?: string;
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  hourlyRate: number;
  totalAmount: number;
  status:
    | "booked"
    | "waiting_for_patient"
    | "active"
    | "completed"
    | "cancelled";
  notes?: string;
  therapistJoinedAt?: string;
  patientJoinedAt?: string;
  chatStartedAt?: string;
  chatEndedAt?: string;
  summaryGeneratedAt?: string;
  aiSummary?: {
    sessionSummary: string;
    mainConcerns: string[];
    emotionalState?: string;
    suggestedExercises: string[];
    therapistNotesDraft?: string;
    followUpRecommendation?: string;
    riskLevel: number;
  };
}

const readError = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data.message || data.error || fallback;
  } catch {
    return fallback;
  }
};

const headers = (tokenKey = "token") => {
  const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : "";
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

async function request<T>(url: string, options: RequestInit, fallback: string): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(await readError(res, fallback));
  }
  return res.json();
}

export const therapistRegister = (payload: Record<string, any>) =>
  request<{ message: string; therapist: Therapist }>(
    "/api/therapist/register",
    { method: "POST", headers: headers("therapistToken"), body: JSON.stringify(payload) },
    "Therapist registration failed",
  );

export const therapistLogin = (email: string, password: string) =>
  request<{ token: string; therapist: Therapist }>(
    "/api/therapist/login",
    { method: "POST", headers: headers("therapistToken"), body: JSON.stringify({ email, password }) },
    "Therapist login failed",
  );

export const getTherapistProfile = () =>
  request<{ therapist: Therapist }>(
    "/api/therapist/profile",
    { headers: headers("therapistToken") },
    "Failed to load therapist profile",
  );

export const getTherapistAppointments = () =>
  request<{ appointments: Appointment[] }>(
    "/api/therapist/appointments",
    { headers: headers("therapistToken") },
    "Failed to load appointments",
  );

export const updateTherapistAvailability = (availability: AvailabilitySlot[]) =>
  request<{ therapist: Therapist; message: string }>(
    "/api/therapist/availability",
    {
      method: "PATCH",
      headers: headers("therapistToken"),
      body: JSON.stringify({ availability }),
    },
    "Failed to update availability",
  );

export const getVerifiedTherapists = () =>
  request<{ therapists: Therapist[] }>(
    "/api/therapists/verified",
    { headers: headers() },
    "Failed to load therapists",
  );

export const getTherapistById = (therapistId: string) =>
  request<{ therapist: Therapist }>(
    `/api/therapists/${therapistId}`,
    { headers: headers() },
    "Failed to load therapist",
  );

export const bookAppointment = (therapistId: string, payload: Record<string, any>) =>
  request<{ appointment: Appointment; message: string }>(
    `/api/therapists/${therapistId}/book`,
    { method: "POST", headers: headers(), body: JSON.stringify(payload) },
    "Failed to book appointment",
  );

export const getMyAppointments = () =>
  request<{ appointments: Appointment[] }>(
    "/api/therapists/appointments/my",
    { headers: headers() },
    "Failed to load appointments",
  );

export const adminRegister = (payload: Record<string, any>) =>
  request<{ message: string }>(
    "/api/admin/register",
    { method: "POST", headers: headers("adminToken"), body: JSON.stringify(payload) },
    "Admin registration failed",
  );

export const adminLogin = (email: string, password: string) =>
  request<{ token: string }>(
    "/api/admin/login",
    { method: "POST", headers: headers("adminToken"), body: JSON.stringify({ email, password }) },
    "Admin login failed",
  );

export const getAdminDashboard = () =>
  request<{ stats: Record<string, number> }>(
    "/api/admin/dashboard",
    { headers: headers("adminToken") },
    "Failed to load admin dashboard",
  );

export const getPendingTherapists = () =>
  request<{ therapists: Therapist[] }>(
    "/api/admin/therapists/pending",
    { headers: headers("adminToken") },
    "Failed to load pending therapists",
  );

export const getAdminTherapists = () =>
  request<{ therapists: Therapist[] }>(
    "/api/admin/therapists",
    { headers: headers("adminToken") },
    "Failed to load therapists",
  );

export const verifyTherapist = (therapistId: string) =>
  request<{ therapist: Therapist }>(
    `/api/admin/therapists/${therapistId}/verify`,
    { method: "PATCH", headers: headers("adminToken") },
    "Failed to verify therapist",
  );

export const rejectTherapist = (therapistId: string) =>
  request<{ therapist: Therapist }>(
    `/api/admin/therapists/${therapistId}/reject`,
    { method: "PATCH", headers: headers("adminToken") },
    "Failed to reject therapist",
  );
