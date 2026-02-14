"use client";

import { useRef, useState } from "react";
import { XCircle, WarningCircle } from "@phosphor-icons/react";

type CancelEventButtonProps = {
    eventId: string;
    eventName: string;
    includeDeleted: boolean;
    action: (formData: FormData) => void;
};

export function CancelEventButton({
    eventId,
    eventName,
    includeDeleted,
    action,
}: CancelEventButtonProps) {
    const [open, setOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                title="Cancel event"
            >
                <XCircle className="size-3.5" weight="bold" />
                Cancel
            </button>

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
                            <div className="flex size-12 items-center justify-center rounded-full bg-red-500/15">
                                <WarningCircle className="size-6 text-red-400" weight="fill" />
                            </div>

                            <h3 className="mt-4 text-base font-semibold text-foreground">
                                Cancel Event?
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Are you sure you want to cancel{" "}
                                <span className="font-medium text-foreground">&ldquo;{eventName}&rdquo;</span>?

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
                                    className="whitespace-nowrap rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                                >
                                    Yes, Cancel Event
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
