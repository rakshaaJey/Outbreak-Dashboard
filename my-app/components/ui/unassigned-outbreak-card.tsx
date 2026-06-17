import { MapPin, Calendar, Microscope, ClipboardList, UserPlus, Trash2 } from "lucide-react";
import type { ManagedOutbreak } from "@/lib/managed-outbreaks";

interface UnassignedOutbreakCardProps {
  outbreak: ManagedOutbreak;
  hasLinelist: boolean;
  deleteMode?: boolean;
  onClaim: () => void;
  onRemove?: () => void;
}

export function UnassignedOutbreakCard({
  outbreak,
  hasLinelist,
  deleteMode = false,
  onClaim,
  onRemove,
}: UnassignedOutbreakCardProps) {
  return (
    <div className="relative group/card">
      <div
        className={`flex flex-col rounded-xl border p-4 transition-all duration-150 ${
          deleteMode
            ? "border-destructive/40 bg-destructive/5"
            : "bg-card hover:shadow-md hover:border-amber-400/50"
        }`}
      >
        {/* Top row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            Unassigned
          </span>
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded truncate">
            {outbreak.setting}
          </span>
        </div>

        {/* Institution name */}
        <h3 className="font-semibold text-sm leading-snug mb-3 line-clamp-2">
          {outbreak.institutionName}
        </h3>

        {/* Details */}
        <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2 leading-snug">{outbreak.address}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Microscope className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{outbreak.causativeAgent || outbreak.type || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{outbreak.startDate}</span>
          </div>
          {hasLinelist && (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <ClipboardList className="h-3.5 w-3.5 shrink-0" />
              <span>Line list attached</span>
            </div>
          )}
        </div>

        {/* Claim button */}
        {!deleteMode && (
          <button
            onClick={onClaim}
            className="mt-auto flex items-center justify-center gap-1.5 w-full rounded-md border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium py-2 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Claim Outbreak
          </button>
        )}
      </div>

      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          className={`absolute top-2 right-2 z-10 h-7 w-7 rounded-full flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 text-destructive transition-opacity ${
            deleteMode ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
          }`}
          title="Remove outbreak"
          aria-label="Remove outbreak"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
