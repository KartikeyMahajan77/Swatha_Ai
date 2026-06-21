"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAppointmentToken,
  getSocketUrl,
  joinAppointmentSession,
} from "@/lib/api/appointments";
import { useSession } from "@/lib/contexts/session-context";

interface SessionStartedPayload {
  appointmentId: string;
  therapistName?: string;
  message: string;
  status?: "waiting_for_patient";
}

export function SessionNotificationListener() {
  const { role, user } = useSession();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [notification, setNotification] =
    useState<SessionStartedPayload | null>(null);

  useEffect(() => {
    if (role !== "user" || !user?._id) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(getSocketUrl(), {
      auth: { token: getAppointmentToken("patient") },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_user_room", { userId: user._id });
    });

    socket.on("therapy_session_started", (payload: SessionStartedPayload) => {
      setNotification(payload);
      window.dispatchEvent(
        new CustomEvent("swastha-therapy-session-started", {
          detail: payload,
        }),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [role, user?._id]);

  if (!notification) {
    return null;
  }

  const joinSession = async () => {
    await joinAppointmentSession(notification.appointmentId);
    setNotification(null);
    router.push(`/appointments/${notification.appointmentId}/chat`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[min(92vw,380px)] rounded-lg border bg-card p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Session started</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {notification.therapistName || "Your therapist"}:{" "}
            {notification.message}. Join now?
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setNotification(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={joinSession}>
          Join Session
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setNotification(null)}
        >
          Later
        </Button>
      </div>
    </div>
  );
}
