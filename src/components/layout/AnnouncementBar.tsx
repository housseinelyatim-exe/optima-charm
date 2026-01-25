import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

export function AnnouncementBar() {
  const { data: settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  const isEnabled = settings?.announcement_enabled === "true";
  const text = settings?.announcement_text || "";

  // Reset dismissed state when announcement text changes
  useEffect(() => {
    setDismissed(false);
  }, [text]);

  if (!isEnabled || !text || dismissed) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm relative">
      <span>{text}</span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-foreground/10 rounded transition-colors"
        aria-label="Fermer l'annonce"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
