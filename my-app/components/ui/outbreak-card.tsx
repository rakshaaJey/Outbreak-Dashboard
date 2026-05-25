import Link from "next/link";
import { MapPin, Calendar, Microscope, Building2 } from "lucide-react";

export interface OutbreakCardProps {
  id: string;
  institutionName: string;
  address: string;
  agent: string;
  outbreakType: string;
  setting: string;
  startDate: string;
  active: boolean;
}

export function OutbreakCard({
  id,
  institutionName,
  address,
  agent,
  outbreakType,
  setting,
  startDate,
  active,
}: OutbreakCardProps) {
  return (
    <Link
      href={`/outbreaks/${id}`}
      className="group flex flex-col aspect-square rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/40 transition-all duration-150"
    >
      {/* Top row: active badge + setting chip */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
            active
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              active ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {active ? "Active" : "Inactive"}
        </span>
        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded truncate">
          {setting}
        </span>
      </div>

      {/* Institution name */}
      <h3 className="font-semibold text-sm leading-snug mb-3 line-clamp-3 group-hover:text-primary transition-colors flex-1">
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
    </Link>
  );
}
