import Link from "next/link";
import { Building2, Calendar, Activity } from "lucide-react";

export interface CaseCardProps {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  role: string;
  classification: string;
  currentStatus: string;
  outbreakName: string;
  outbreakSetting: string;
  symptomOnset: string;
  asx: boolean;
}

const CLASSIFICATION_STYLES: Record<string, string> = {
  Confirmed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  Probable: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  "Does Not Meet Definition": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_STYLES: Record<string, string> = {
  Recovered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Active: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  Hospitalized: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  "Lost to Follow-Up": "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export function CaseCard({
  id,
  firstName,
  lastName,
  gender,
  role,
  classification,
  currentStatus,
  outbreakName,
  outbreakSetting,
  symptomOnset,
  asx,
}: CaseCardProps) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const classLabel =
    classification === "Does Not Meet Definition" ? "DNM" : classification;

  return (
    <Link
      href={`/cases/${id}`}
      className="group flex flex-col aspect-square rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/40 transition-all duration-150"
    >
      {/* Top row: classification badge + status chip */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
            CLASSIFICATION_STYLES[classification] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {classLabel}
        </span>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full truncate ${
            STATUS_STYLES[currentStatus] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {currentStatus}
        </span>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors truncate">
            {lastName}, {firstName}
          </p>
          <p className="text-xs text-muted-foreground">{gender} · {role}</p>
        </div>
      </div>

      {/* Bottom details */}
      <div className="space-y-1.5 text-xs text-muted-foreground mt-auto">
        <div className="flex items-start gap-1.5">
          <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2 leading-snug">{outbreakName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{outbreakSetting}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{asx ? "Asymptomatic" : symptomOnset || "No onset recorded"}</span>
        </div>
      </div>
    </Link>
  );
}
