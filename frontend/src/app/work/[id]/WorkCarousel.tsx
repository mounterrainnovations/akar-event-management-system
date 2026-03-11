"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { instrumentSerif } from "@/lib/fonts";

export function WorkCarousel({ images, title, category, author }: { images: string[], title: string, category: string, author: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (images.length <= 1) return;
        if (isHovered) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 7000);

        return () => clearInterval(timer);
    }, [images.length, isHovered]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) return null;

    if (images.length === 1) {
        return (
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[2rem] lg:rounded-[3rem] overflow-hidden bg-neutral-100 shadow-2xl border border-white/20 group">
                <img src={images[0]} alt={title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 pointer-events-none z-10" />
                
                {/* Hero Overlay Details */}
                <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-10 pb-8 lg:pb-12 pointer-events-none z-20">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-white bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                            {category}
                        </span>
                    </div>
                    <h1 className={`${instrumentSerif.className} text-white text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-[1.05] max-w-3xl mb-3`}>
                        {title}
                    </h1>
                    <p className="text-lg font-medium text-white/80">
                        By {author}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[2rem] lg:rounded-[3rem] overflow-hidden bg-neutral-100 shadow-2xl border border-white/20 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence initial={false} mode="wait">
                <motion.img
                    key={currentIndex}
                    src={images[currentIndex]}
                    alt={`${title} - Image ${currentIndex + 1}`}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </AnimatePresence>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 pointer-events-none z-10" />

            {/* Hero Overlay Details */}
            <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-10 pb-8 lg:pb-12 pointer-events-none z-20">
                <div className="flex items-center gap-4 mb-4 mt-auto">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-white bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                        {category}
                    </span>
                </div>
                <h1 className={`${instrumentSerif.className} text-white text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-[1.05] max-w-3xl mb-3`}>
                    {title}
                </h1>
                <p className="text-lg font-medium text-white/80">
                    By {author}
                </p>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
                <button 
                    onClick={(e) => { e.preventDefault(); handlePrev(); }}
                    className="p-2 sm:p-3 rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 border border-white/20 pointer-events-auto"
                >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                </button>
                <button 
                    onClick={(e) => { e.preventDefault(); handleNext(); }}
                    className="p-2 sm:p-3 rounded-full bg-white/20 text-white shadow-lg backdrop-blur-md hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 border border-white/20 pointer-events-auto"
                >
                    <ChevronRight size={24} strokeWidth={2.5} />
                </button>
            </div>

            {/* Dots Pagination */}
            <div className="absolute bottom-4 inset-x-0 flex justify-end px-4 lg:px-10 z-30 pointer-events-auto">
                <div className="flex bg-black/20 backdrop-blur-md px-3 py-2 rounded-full gap-2 border border-white/10">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                idx === currentIndex 
                                    ? "w-6 bg-white shadow-sm" 
                                    : "w-2 bg-white/50 hover:bg-white/80"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
