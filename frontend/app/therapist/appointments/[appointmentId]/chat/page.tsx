"use client";

import { useParams } from "next/navigation";
import { TherapyAppointmentChat } from "@/components/therapy/therapy-appointment-chat";
import { useRequireRole } from "@/lib/hooks/use-role-redirect";

export default function TherapistAppointmentChatPage() {
  const params = useParams<{ appointmentId: string }>();
  const roleGuard = useRequireRole(["therapist"]);

  if (!roleGuard.isAllowed) {
    return null;
  }

  return (
    <TherapyAppointmentChat
      appointmentId={params.appointmentId}
      role="therapist"
    />
  );
}
