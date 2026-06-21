import Link from "next/link";
import { AudioWaveform } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col items-center gap-3 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <AudioWaveform className="h-5 w-5 text-primary" />
          <span className="font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Swastha AI
          </span>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Your Mental Health Companion — Always here to listen.
        </p>
        <p className="text-xs text-muted-foreground/60 text-center">
          © 2025 Swastha AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
