import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BanConfirmationModalProps {
  zone: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A bottom-sheet style confirmation modal for banning a zone.
 */
export function BanConfirmationModal({
  zone,
  onConfirm,
  onCancel,
}: BanConfirmationModalProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-6 px-4 animate-in slide-in-from-bottom-4 duration-200">
      <div className="w-full max-w-sm rounded-2xl border-2 border-red-500/40 bg-card shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-base">
            Ban <span className="text-red-500">Zone {zone}</span> for the
            opponent?
          </p>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
            aria-label="Cancel"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          This cannot be undone. The opponent will not be able to shoot from Zone{" "}
          {zone} in Round 2.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            Confirm Ban
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BanConfirmationModal;
