import Link from "next/link";
import { MapPin, Calendar, Microscope, Trash2 } from "lucide-react";

export interface OutbreakCardProps {
  id: string;
  outbreakNumber?: string;
  institutionName: string;
  address: string;
  agent: string;
  outbreakType: string;
  setting: string;
  startDate: string;
  active: boolean;
  deleteMode?: boolean;
  onRemove?: () => void;
}

export function OutbreakCard({
  id,
  outbreakNumber,
  institutionName,
  address,
  agent,
  outbreakType,
  setting,
  startDate,
  active,
  deleteMode = false,
  onRemove,
}: OutbreakCardProps) {
  const slug = outbreakNumber ? encodeURIComponent(outbreakNumber) : id;

  const content = (
    <>
      {/* Top row: active badge + setting chip */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
            active
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-green-500" : "bg-red-500"}`} />
          {active ? "Active" : "Inactive"}
        </span>
        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded truncate">
          {setting}
        </span>
      </div>

      {/* Institution name */}
      <h3 className={`font-semibold text-sm leading-snug mb-3 line-clamp-3 flex-1 transition-colors ${
        deleteMode ? "text-muted-foreground" : "group-hover:text-primary"
      }`}>
        {institutionName}
      </h3>

      {/* Detail rows */}
      <div className="space-y-1.5 text-xs text-muted-foreground mt-auto">
        <div className="flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2 leading-snug">{address}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Microscope className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{agent || outbreakType || "Unknown"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{startDate}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative group/card">
      {deleteMode ? (
        <div className="flex flex-col aspect-square rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4 transition-all duration-150">
          {content}
        </div>
      ) : (
        <Link
          href={`/outbreaks/${slug}`}
          className="group flex flex-col aspect-square rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/40 transition-all duration-150"
        >
          {content}
        </Link>
      )}

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
