'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { fetchSectionMedia, type WebsiteMediaItem } from '@/lib/websiteMedia';
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PastEventsCarousel() {
    const [images, setImages] = useState<WebsiteMediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const autoTimerRef = useRef<number | null>(null);

    useEffect(() => {
        let active = true;
        async function load() {
            const items = await fetchSectionMedia('past-events', { active: true });
            if (!active) return;
            setImages(items);
            setLoading(false);
        }
        load();
        return () => {
            active = false;
        };
    }, []);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 4);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
        const card = el.querySelector<HTMLElement>('[data-carousel-card="true"]');
        if (!card) return;
        const cardWidth = card.clientWidth;
        if (cardWidth <= 0) return;
        const nextIndex = Math.round(scrollLeft / cardWidth);
        if (!Number.isNaN(nextIndex)) {
            setActiveIndex(Math.max(0, Math.min(images.length - 1, nextIndex)));
        }
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateScrollState();
        const onScroll = () => updateScrollState();
        el.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateScrollState);
        return () => {
            el.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', updateScrollState);
        };
    }, [images.length, updateScrollState]);

    const scrollToIndex = useCallback((index: number) => {
        const el = scrollRef.current;
        if (!el) return;
        const card = el.querySelector<HTMLElement>('[data-carousel-card="true"]');
        if (!card) return;
        const cardWidth = card.clientWidth;
        el.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        const nextIndex =
            direction === 'left'
                ? Math.max(0, activeIndex - 1)
                : Math.min(images.length - 1, activeIndex + 1);
        scrollToIndex(nextIndex);
    };

    useEffect(() => {
        if (autoTimerRef.current) {
            window.clearInterval(autoTimerRef.current);
        }
        if (images.length <= 1 || isHovering) {
            return;
        }
        autoTimerRef.current = window.setInterval(() => {
            setActiveIndex((prev) => {
                const next = (prev + 1) % images.length;
                scrollToIndex(next);
                return next;
            });
        }, 5000);
        return () => {
            if (autoTimerRef.current) {
                window.clearInterval(autoTimerRef.current);
            }
        };
    }, [images.length, isHovering, scrollToIndex]);

    if (loading || images.length === 0) return null;

    return (
        <div className="w-full relative mt-8">
            <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center shadow-sm">
                        <ImageIcon className="w-4 h-4 text-[#E91E63]" />
                    </div>
                    <div>
                        <h2 className="font-montserrat text-[#1a1a1a] text-base md:text-lg font-bold leading-tight">
                            Our Past Events
                        </h2>
                        <p className="font-montserrat text-[#1a1a1a]/50 text-xs md:text-sm">
                            A glimpse of the moments we created
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        aria-label="Scroll past events left"
                        className={`p-2 rounded-full border border-white/60 backdrop-blur-md transition-all ${canScrollLeft
                            ? 'bg-white/70 hover:bg-white text-[#1a1a1a] shadow-sm'
                            : 'bg-white/40 text-[#1a1a1a]/30 cursor-not-allowed'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        aria-label="Scroll past events right"
                        className={`p-2 rounded-full border border-white/60 backdrop-blur-md transition-all ${canScrollRight
                            ? 'bg-white/70 hover:bg-white text-[#1a1a1a] shadow-sm'
                            : 'bg-white/40 text-[#1a1a1a]/30 cursor-not-allowed'
                            }`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="scrollbar-hide flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {images.map((img, index) => {
                    const label = img.title || img.description || img.fileName || `Past Event ${index + 1}`;
                    return (
                        <div
                            key={img.id}
                            data-carousel-card="true"
                            className="w-full flex-[0_0_100%] snap-start"
                        >
                            <div className="max-w-5xl mx-auto">
                                <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-white/20 bg-gray-50 cursor-pointer group">
                                    <Image
                                        src={img.previewUrl}
                                        alt={label}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/5" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10 md:px-7 md:pb-7">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-montserrat text-white text-sm md:text-base font-semibold truncate">
                                                {label}
                                            </p>
                                            <span className="font-montserrat text-white/70 text-[10px] md:text-xs font-medium shrink-0">
                                                {String(index + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')}
                                            </span>
                                        </div>
                                        {img.description && (
                                            <p className="font-montserrat text-white/70 text-xs md:text-sm mt-1 truncate">
                                                {img.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }` }} />
        </div>
    );
}
