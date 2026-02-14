"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
    date?: Date;
    setDate: (date: Date) => void;
    className?: string;
    placeholder?: string;
    minDate?: Date;
    disabled?: boolean;
}

export function DateTimePicker({
    date,
    setDate,
    className,
    placeholder = "Pick a date",
    minDate,
    disabled = false,
}: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
        date
    );
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        setSelectedDate(date);
    }, [date]);

    const handleSelect = (newDate: Date | undefined) => {
        if (newDate) {
            const updatedDate = new Date(
                newDate.getFullYear(),
                newDate.getMonth(),
                newDate.getDate(),
                selectedDate?.getHours() || 0,
                selectedDate?.getMinutes() || 0
            );
            setSelectedDate(updatedDate);
            setDate(updatedDate);
        }
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

    const handleTimeChange = (type: "hour" | "minute", value: number) => {
        if (!selectedDate) return;
        const newDate = new Date(selectedDate);
        if (type === "hour") {
            newDate.setHours(value);
        } else {
            newDate.setMinutes(value);
        }
        setSelectedDate(newDate);
        setDate(newDate);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" weight="bold" />
                    {date ? (
                        format(date, "PPP HH:mm")
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex sm:flex-row flex-col">
                    <div className="p-3">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleSelect}
                            initialFocus
                            disabled={(date) => {
                                // Disable dates before today (absolute minimum)
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                if (date < today) return true;

                                // Disable dates before minDate (if provided)
                                if (minDate) {
                                    const minDateStart = new Date(minDate);
                                    minDateStart.setHours(0, 0, 0, 0);
                                    return date < minDateStart;
                                }

                                return false;
                            }}
                        />
                    </div>

                    <div className="flex flex-col sm:border-l border-t sm:border-t-0 border-border p-3 w-full sm:w-auto">
                        <div className="font-medium text-sm mb-3 flex items-center justify-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            Time
                        </div>
                        <div className="flex gap-2 h-[280px]">
                            {/* Hours */}
                            <div className="flex flex-col flex-1 w-16">
                                <div className="text-xs font-medium text-center mb-2 text-muted-foreground">Hr</div>
                                <ScrollArea className="h-full w-full rounded-md border text-center">
                                    <div className="p-1 space-y-1">
                                        {hours.map((hour) => {
                                            // Check against current time (today)
                                            const isToday = selectedDate && selectedDate.toDateString() === new Date().toDateString();
                                            const isPastHourToday = isToday && hour < new Date().getHours();

                                            // Check against minDate
                                            const isMinDate = selectedDate && minDate && selectedDate.toDateString() === minDate.toDateString();
                                            const isBeforeMinHour = isMinDate && hour < minDate.getHours();

                                            return (
                                                <Button
                                                    key={hour}
                                                    variant={selectedDate && selectedDate.getHours() === hour ? "default" : "ghost"}
                                                    size="sm"
                                                    className="w-full shrink-0 aspect-square"
                                                    onClick={() => handleTimeChange("hour", hour)}
                                                    disabled={!selectedDate || isPastHourToday || isBeforeMinHour}
                                                >
                                                    {hour.toString().padStart(2, "0")}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <ScrollBar orientation="vertical" className="hidden" />
                                </ScrollArea>
                            </div>

                            {/* Separator */}
                            <div className="h-full w-[1px] bg-border my-auto" />

                            {/* Minutes */}
                            <div className="flex flex-col flex-1 w-16">
                                <div className="text-xs font-medium text-center mb-2 text-muted-foreground">Min</div>
                                <ScrollArea className="h-full w-full rounded-md border text-center">
                                    <div className="p-1 space-y-1">
                                        {minutes.map((minute) => {
                                            // Check against current time (today)
                                            const isToday = selectedDate && selectedDate.toDateString() === new Date().toDateString();
                                            const isCurrentHour = selectedDate && selectedDate.getHours() === new Date().getHours();
                                            const isPastMinuteToday = isToday && isCurrentHour && minute < new Date().getMinutes();

                                            // Check against minDate
                                            const isMinDate = selectedDate && minDate && selectedDate.toDateString() === minDate.toDateString();
                                            const isMinHour = selectedDate && minDate && selectedDate.getHours() === minDate.getHours();
                                            const isBeforeMinMinute = isMinDate && isMinHour && minute < minDate.getMinutes();

                                            // Also disable minutes if hour is not valid (though hour selection should prevent this, it's good safety)
                                            const isPastHourToday = isToday && selectedDate.getHours() < new Date().getHours();
                                            const isBeforeMinHour = isMinDate && selectedDate.getHours() < minDate.getHours();


                                            return (
                                                <Button
                                                    key={minute}
                                                    variant={selectedDate && selectedDate.getMinutes() === minute ? "default" : "ghost"}
                                                    size="sm"
                                                    className="w-full shrink-0 aspect-square"
                                                    onClick={() => handleTimeChange("minute", minute)}
                                                    disabled={!selectedDate || isPastMinuteToday || isBeforeMinMinute || isPastHourToday || isBeforeMinHour}
                                                >
                                                    {minute.toString().padStart(2, "0")}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <ScrollBar orientation="vertical" className="hidden" />
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
