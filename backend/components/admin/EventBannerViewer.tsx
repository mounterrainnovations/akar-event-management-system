"use client";

import { useState } from "react";
import Image from "next/image";
import { DownloadSimple, X, Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";

interface EventBannerViewerProps {
    bannerUrl: string | null;
    eventName: string;
}

export function EventBannerViewer({ bannerUrl, eventName }: EventBannerViewerProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!bannerUrl) {
        return (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted/50 border border-border/50">
                <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
            </div>
        );
    }

    const handleDownload = async () => {
        try {
            const response = await fetch(bannerUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            // Sanitize filename
            const safeName = eventName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            link.download = `${safeName}_banner.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download image", error);
            // Fallback: open in new tab if download fails
            window.open(bannerUrl, "_blank");
        }
    };

    return (
        <>
            {/* Thumbnail Trigger */}
            <div
                className="group relative h-10 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border/50 bg-muted transition-all hover:ring-2 hover:ring-primary/20"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen(true);
                }}
            >
                <Image
                    src={bannerUrl}
                    alt={`${eventName} banner`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
            </div>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }}
                >
                    <div
                        className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-border/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-3">
                            <h3 className="text-sm font-medium pr-8 truncate max-w-[300px]">{eventName}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                                    title="Download Banner"
                                >
                                    <DownloadSimple className="size-5" weight="bold" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                                    title="Close"
                                >
                                    <X className="size-5" weight="bold" />
                                </button>
                            </div>
                        </div>

                        {/* Image Container */}
                        <div className="relative flex items-center justify-center bg-zinc-950 p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={bannerUrl}
                                alt={eventName}
                                className="max-h-[80vh] max-w-full object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
