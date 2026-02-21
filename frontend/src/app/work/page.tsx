"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { instrumentSerif } from "@/lib/fonts";
import { fetchWorks, type WorkItem, type WorkCategory } from "@/lib/works";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const container = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const wordAnim = {
    hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
    },
};

const FILTERS = [
    { label: "All Works", value: "all" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Past", value: "past" },
    { label: "Articles", value: "article" },
];

export default function WorkPage() {
    const [works, setWorks] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");

    useEffect(() => {
        async function loadWorks() {
            setLoading(true);
            try {
                const results = await fetchWorks(activeFilter !== "all" ? (activeFilter as WorkCategory) : undefined);
                setWorks(results);
            } catch (error) {
                console.error("Failed to load works", error);
            } finally {
                setLoading(false);
            }
        }
        loadWorks();
    }, [activeFilter]);

    return (
        <main className="min-h-screen relative bg-white overflow-hidden pb-32">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("/event_bg.png")' }} />

            <div className="relative z-10 pt-[120px]">
                {/* Header Section */}
                <section className="px-4 md:px-12 lg:px-16 text-center lg:text-left mb-16">
                    <div className="max-w-5xl mx-auto lg:mx-0">
                        <motion.h1
                            className={`${instrumentSerif.className} text-[#1a1a1a] text-[12vw] md:text-[7.5vw] lg:text-[7vw] xl:text-[6vw] leading-[1] md:leading-[0.95] tracking-[-0.02em]`}
                            variants={container}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.3 }}
                        >
                            <div className="block">
                                {["Our", "Selected"].map((word, i) => (
                                    <motion.span key={`title-${i}`} variants={wordAnim} className="inline-block mr-[0.3em]">
                                        {word}
                                    </motion.span>
                                ))}
                            </div>
                            <div className="block text-[#1a1a1a]/40">
                                {["Works,", "Stories", "&", "More."].map((word, i) => (
                                    <motion.span key={`subtitle-${i}`} variants={wordAnim} className="inline-block mr-[0.3em]">
                                        {word}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.h1>
                    </div>
                </section>

                {/* Filter Navigation */}
                <section className="px-4 md:px-12 lg:px-16 mb-12">
                    <div className="flex flex-wrap items-center gap-3">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setActiveFilter(filter.value)}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${activeFilter === filter.value
                                        ? "bg-[#1a1a1a] text-white shadow-lg shadow-black/10 scale-105"
                                        : "bg-[#1a1a1a]/5 text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/10 hover:text-[#1a1a1a]"
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Works Grid */}
                <section className="px-4 md:px-12 lg:px-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-16">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <motion.div key={`skeleton-${i}`} className="animate-pulse flex flex-col pt-4">
                                        <div className="w-full aspect-[4/3] bg-black/5 rounded-2xl mb-6" />
                                        <div className="h-4 bg-black/5 rounded-md w-24 mb-4" />
                                        <div className="h-8 bg-black/5 rounded-md w-3/4 mb-3" />
                                    </motion.div>
                                ))
                            ) : works.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <h3 className={`${instrumentSerif.className} text-3xl text-[#1a1a1a] mb-2`}>No matching results</h3>
                                    <p className="text-[#1a1a1a]/50">Check back soon for new content and updates.</p>
                                </div>
                            ) : (
                                works.map((work) => (
                                    <Link key={work.id} href={`/Work/${work.id}`} className="group relative outline-none block">
                                        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#f1f1f1] mb-6 shadow-sm border border-[#1a1a1a]/5">
                                            {work.coverImageUrl ? (
                                                <img
                                                    src={work.coverImageUrl}
                                                    alt={work.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-black/5 text-black/20 font-medium">
                                                    No Preview
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 ease-out flex items-center justify-center">
                                                <div className="bg-white text-black p-4 rounded-full opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out shadow-xl transform translate-y-4 group-hover:translate-y-0">
                                                    <ArrowUpRight strokeWidth={2.5} size={24} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 px-1">
                                            <div className="flex items-center justify-between">
                                                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 bg-[#1a1a1a]/5 px-3 py-1 rounded-full">
                                                    {work.category}
                                                </span>
                                                <span className="text-sm font-medium text-[#1a1a1a]/40">
                                                    {format(new Date(work.createdAt), "MMM d, yyyy")}
                                                </span>
                                            </div>

                                            <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl text-[#1a1a1a] leading-[1.1] transition-colors group-hover:text-[#db2929]`}>
                                                {work.title}
                                            </h2>
                                            <p className="text-sm font-semibold text-[#1a1a1a]/70">
                                                By {work.author}
                                            </p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </main>
    );
}
