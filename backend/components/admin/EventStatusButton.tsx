"use client";

import { useRef, useState } from "react";
import { WarningCircle, CheckCircle } from "@phosphor-icons/react";

type EventStatusButtonProps = {
    eventId: string;
    eventName: string;
    includeDeleted: boolean;
    action: (formData: FormData) => void;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "destructive" | "constructive"; // destructive = red, constructive = green/primary
    trigger: React.ReactNode;
};

export function EventStatusButton({
    eventId,
    eventName,
    includeDeleted,
    action,
    title,
    description,
    confirmLabel,
    variant,
    trigger,
}: EventStatusButtonProps) {
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const isDestructive = variant === "destructive";

    return (
        <>
            {/* Trigger */}
            <div onClick={() => setOpen(true)} className="cursor-pointer">
                {trigger}
            </div>

            {/* Confirmation Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Dialog */}
                    <div className="relative z-10 w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div
                                className={`flex size-12 items-center justify-center rounded-full ${isDestructive ? "bg-red-500/15" : "bg-emerald-500/15"
                                    }`}
                            >
                                {isDestructive ? (
                                    <WarningCircle className="size-6 text-red-500" weight="fill" />
                                ) : (
                                    <CheckCircle className="size-6 text-emerald-500" weight="fill" />
                                )}
                            </div>

                            <h3 className="mt-4 text-base font-semibold text-foreground">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {description.replace("{eventName}", eventName)}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="whitespace-nowrap rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                Go Back
                            </button>

                            <form ref={formRef} action={action}>
                                <input type="hidden" name="eventId" value={eventId} />
                                {includeDeleted && <input type="hidden" name="includeDeleted" value="1" />}
                                <button
                                    type="submit"
                                    className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors ${isDestructive
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-emerald-500 hover:bg-emerald-600"
                                        }`}
                                >
                                    {confirmLabel}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
