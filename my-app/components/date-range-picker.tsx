"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
}

export function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const parseDateInput = (value: string) =>
    value ? new Date(`${value}T00:00:00`) : null;

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    onDateRangeChange(
      parseDateInput(newStartDate),
      parseDateInput(endDate)
    );
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    onDateRangeChange(
      parseDateInput(startDate),
      parseDateInput(newEndDate)
    );
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    onDateRangeChange(null, null);
  };

  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" />
        <h3 className="font-semibold">Filter by Date Range</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
          />
        </div>

        <Button 
          onClick={handleReset} 
          variant="outline" 
          className="w-full"
        >
          Reset Dates
        </Button>
      </div>
    </div>
  );
}
