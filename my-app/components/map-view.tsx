"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import Papa from "papaparse";

interface MapViewProps {
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  setting: string;
  outbreakType: string;
  agent: string;
}

interface OutbreakRecord {
  _id: string;
  "Institution Name": string;
  "Institution Address": string;
  "Outbreak Setting": string;
  "Type of Outbreak": string;
  "Causative Agent-1": string;
  "Causative Agent-2": string;
  "Date Outbreak Began": string;
  "Date Declared Over": string;
  Active: string;
}

const TORONTO_CENTER: [number, number] = [43.7, -79.4];

function createPinIcon(active: boolean): L.DivIcon {
  const fill = active ? "#22c55e" : "#ef4444";
  const shadow = active ? "#16a34a" : "#dc2626";
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 28 8 28S20 13.4 20 8c0-4.4-3.6-8-8-8z" fill="${shadow}"/>
      <path d="M12 1C7.7 1 4.5 4.1 4.5 8c0 5.2 7.5 26 7.5 26S19.5 13.2 19.5 8C19.5 4.1 16.3 1 12 1z" fill="${fill}"/>
      <circle cx="12" cy="8" r="3.5" fill="white" opacity="0.9"/>
    </svg>`,
    className: "",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
  });
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(record: OutbreakRecord): string {
  const isActive = record.Active === "Y";
  const dotColor = isActive ? "#22c55e" : "#ef4444";
  const labelColor = isActive ? "#15803d" : "#dc2626";
  const agent2 = record["Causative Agent-2"] ? `, ${esc(record["Causative Agent-2"])}` : "";
  return `
    <div style="min-width:220px;font-size:13px;line-height:1.5">
      <p style="font-weight:600;font-size:14px;margin:0 0 2px">${esc(record["Institution Name"])}</p>
      <p style="color:#6b7280;font-size:11px;margin:0 0 6px">${esc(record["Institution Address"])}</p>
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0"></span>
        <span style="font-weight:500;color:${labelColor}">${isActive ? "Active" : "Inactive"}</span>
      </div>
      <hr style="margin:6px 0;border:none;border-top:1px solid #e5e7eb"/>
      <p style="margin:2px 0"><strong>Setting:</strong> ${esc(record["Outbreak Setting"])}</p>
      <p style="margin:2px 0"><strong>Type:</strong> ${esc(record["Type of Outbreak"])}</p>
      <p style="margin:2px 0"><strong>Agent:</strong> ${esc(record["Causative Agent-1"] || "Unknown")}${agent2}</p>
      <p style="margin:2px 0"><strong>Began:</strong> ${esc(record["Date Outbreak Began"])}</p>
      <p style="margin:2px 0"><strong>Declared over:</strong> ${esc(record["Date Declared Over"] || "Still active")}</p>
    </div>`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getMarkerPosition(name: string): [number, number] {
  const hash = hashString(name);
  const lat = TORONTO_CENTER[0] + ((hash % 1000) / 1000) * 0.15 - 0.075;
  const lng = TORONTO_CENTER[1] + (((hash / 1000) % 1000) / 1000) * 0.15 - 0.075;
  return [lat, lng];
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function recordMatchesFilter(
  record: OutbreakRecord,
  startDate: Date | null,
  endDate: Date | null,
  status: string,
  setting: string,
  outbreakType: string,
  agent: string,
): boolean {
  const began = parseDate(record["Date Outbreak Began"]);
  if (!began) return false;
  if (startDate && began < startDate) return false;
  if (endDate && began > endDate) return false;
  if (status === "Active" && record.Active !== "Y") return false;
  if (status === "Inactive" && record.Active !== "N") return false;
  if (setting && record["Outbreak Setting"] !== setting) return false;
  if (outbreakType && record["Type of Outbreak"] !== outbreakType) return false;
  if (agent && record["Causative Agent-1"] !== agent && record["Causative Agent-2"] !== agent) return false;
  return true;
}

// Imperative layer: owns add/remove of all L.Markers so filter changes are
// always reflected immediately, bypassing react-leaflet's reconciliation.
function MarkerLayer({
  records,
  activeIcon,
  inactiveIcon,
}: {
  records: OutbreakRecord[];
  activeIcon: L.DivIcon;
  inactiveIcon: L.DivIcon;
}) {
  const map = useMap();

  useEffect(() => {
    const markers = records.map((record) => {
      const isActive = record.Active === "Y";
      const marker = L.marker(getMarkerPosition(record["Institution Name"]), {
        icon: isActive ? activeIcon : inactiveIcon,
      });
      marker.bindPopup(popupHtml(record), { minWidth: 220 });
      marker.addTo(map);
      return marker;
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [records, map, activeIcon, inactiveIcon]);

  return null;
}

export function MapView({ startDate, endDate, status, setting, outbreakType, agent }: MapViewProps) {
  const [records, setRecords] = useState<OutbreakRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeIcon = useMemo(() => createPinIcon(true), []);
  const inactiveIcon = useMemo(() => createPinIcon(false), []);

  useEffect(() => {
    async function loadRecords() {
      try {
        const response = await fetch("/outbreaks.csv");
        if (!response.ok) throw new Error(`Failed to load outbreaks.csv (${response.status})`);
        const { data } = Papa.parse<OutbreakRecord>(await response.text(), {
          header: true,
          skipEmptyLines: true,
        });
        setRecords(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load outbreak data");
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, []);

  const filteredRecords = useMemo(
    () => records.filter((r) => recordMatchesFilter(r, startDate, endDate, status, setting, outbreakType, agent)),
    [records, startDate, endDate, status, setting, outbreakType, agent]
  );

  const activeCount = useMemo(
    () => filteredRecords.filter((r) => r.Active === "Y").length,
    [filteredRecords]
  );

  return (
    <div className="rounded-lg border overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b bg-background">
        <h2 className="text-xl font-semibold">Map View</h2>
        <p className="text-muted-foreground mt-1">Click a marker to see outbreak details.</p>
      </div>

      <div className="px-6 py-3 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {filteredRecords.length} outbreak{filteredRecords.length === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
            Active ({activeCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
            Inactive ({filteredRecords.length - activeCount})
          </span>
        </div>
        <div className="rounded-lg border bg-card px-3 py-1.5 text-sm text-muted-foreground">
          {startDate || endDate ? (
            <span>
              {startDate ? startDate.toLocaleDateString() : "Beginning"} &rarr;{" "}
              {endDate ? endDate.toLocaleDateString() : "Now"}
            </span>
          ) : (
            <span>All outbreaks</span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading outbreak map...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">{error}</div>
        ) : (
          <>
            <MapContainer
              center={TORONTO_CENTER}
              zoom={11}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MarkerLayer
                records={filteredRecords}
                activeIcon={activeIcon}
                inactiveIcon={inactiveIcon}
              />
            </MapContainer>

            {filteredRecords.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
                <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  No outbreaks match the current filters
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
