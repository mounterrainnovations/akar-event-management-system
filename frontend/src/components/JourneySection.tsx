'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { instrumentSerif } from '@/lib/fonts';

const journeyData = [
    {
        year: '2022',
        title: 'The Beginning',
        description: 'Founded with a vision to create a supportive ecosystem for women, starting with small community gatherings focused on connection and shared growth.',
        // Using a sophisticated abstract/minimalist image as placeholder
        image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop'
    },
    {
        year: '2023',
        title: 'Community Growth',
        description: 'Expanded our reach to three major cities, launching our first mentorship program that connected over 200 aspiring leaders.',
        image: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=2070&auto=format&fit=crop'
    },
    {
        year: '2024',
        title: 'Digital Innovation',
        description: 'Launched our digital platform, making resources and workshops accessible to women in remote areas, bridging the gap.',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop'
    },
    {
        year: '2025',
        title: 'Strategic Partnerships',
        description: 'Formed key alliances with improved global organizations to provide funding and international exposure for our members.',
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop'
    },
    {
        year: '2026',
        title: 'Global Summit',
        description: 'Hosting our first international summit, bringing together thought leaders from around the world to shape the future of women empowerment.',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop'
    },
];

export default function JourneySection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Update active index on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const container = scrollRef.current;
                const containerWidth = container.offsetWidth;

                // Calculate the center of the container
                const containerCenter = container.getBoundingClientRect().left + containerWidth / 2;

                // Find the card whose center is closest to the container's center
                const cards = Array.from(container.children).slice(0, journeyData.length);

                let closestIndex = 0;
                let closestDistance = Infinity;

                cards.forEach((card, index) => {
                    const cardElement = card as HTMLElement;
                    const cardRect = cardElement.getBoundingClientRect();
                    const cardCenter = cardRect.left + cardRect.width / 2;

                    const distance = Math.abs(containerCenter - cardCenter);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestIndex = index;
                    }
                });

                setActiveIndex(closestIndex);
            }
        };

        const container = scrollRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            // Initial check
            handleScroll();
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    // Enable horizontal scrolling with mouse wheel
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            // If deltaX is 0 and deltaY is present (vertical scroll intent), map to horizontal
            if (Math.abs(e.deltaX) < 10 && Math.abs(e.deltaY) > 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scrollRef.current) {
            setIsDragging(true);
            setStartX(e.pageX);
            setScrollLeft(scrollRef.current.scrollLeft);
        }
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX;
        const walk = (x - startX) * 2; // Scroll-fast
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const scrollToYear = (index: number) => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            const card = container.children[index] as HTMLElement;

            // Center the card
            const cardRect = card.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft + (cardRect.left - containerRect.left) - (containerRect.width / 2) + (cardRect.width / 2);

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="min-h-screen py-24 text-[#1a1a1a] flex flex-col justify-center overflow-hidden relative">

            {/* Header */}
            <div className="w-full px-4 md:px-12 lg:px-16 mb-12">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`${instrumentSerif.className} text-5xl md:text-7xl mb-4`}
                >
                    The Journey of Akar Women Group
                </motion.h2>
            </div>

            {/* Cards Scroll Container */}
            <div
                ref={scrollRef}
                className={`flex gap-4 md:gap-8 overflow-x-auto pb-12 px-4 md:px-[25vw] scrollbar-hide items-center w-full relative cursor-grab active:cursor-grabbing select-none ${isDragging ? '' : 'snap-x snap-mandatory'}`}
                style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {journeyData.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`
                            snap-center shrink-0 relative
                            w-[85vw] md:w-[900px] h-[500px]
                            rounded-[30px] overflow-hidden
                            transition-all duration-500
                            ${activeIndex === index ? 'opacity-100 scale-100' : 'opacity-40 scale-95 grayscale'}
                        `}
                    >
                        <div className="flex w-full h-full">
                            {/* Left Side - Image/Visual */}
                            <div className="w-1/2 bg-black relative flex items-end justify-center overflow-hidden">
                                <div className="relative w-full h-full">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        draggable={false}
                                        className="object-cover opacity-80"
                                    />
                                    {/* Gradient overlay to blend with black bg if needed */}
                                    <div className="absolute inset-0 bg-black/20" />
                                </div>
                            </div>

                            {/* Right Side - Content */}
                            <div className="w-1/2 bg-[#1a1a1a] p-8 md:p-12 flex flex-col relative text-white">
                                {/* Year at top */}
                                <div className={`${instrumentSerif.className} text-6xl md:text-8xl mb-auto`}>
                                    {item.year}
                                </div>

                                {/* Content at bottom */}
                                <div className="flex flex-col gap-6">
                                    <h3 className={`${instrumentSerif.className} text-3xl md:text-4xl leading-tight`}>
                                        {item.title}
                                    </h3>
                                    <p className="text-white/60 text-sm md:text-base leading-relaxed font-light">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                ))}

                {/* Spacer for last item alignment */}
                <div className="w-[1vw] shrink-0" />
            </div>

            {/* Timeline */}
            <div className="container mx-auto px-12 mt-8 md:mt-12">
                <div className="relative w-full h-px bg-[#1a1a1a]/20 flex justify-between items-center">

                    {/* Progress Line (Optional - can be complex to animate perfectly with scroll, omitting for clean simple dots) */}

                    {journeyData.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToYear(index)}
                            className="relative group focus:outline-none"
                        >
                            {/* Year Label */}
                            <div className={`
                                absolute -top-8 left-1/2 -translate-x-1/2 
                                ${instrumentSerif.className} text-lg md:text-2xl transition-all duration-300
                                ${activeIndex === index ? 'text-[#1a1a1a] scale-110 font-medium' : 'text-[#1a1a1a]/40 scale-100'}
                            `}>
                                {item.year}
                            </div>

                            {/* Dot */}
                            <div className={`
                                w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 border border-[#1a1a1a]/10
                                ${activeIndex === index ? 'bg-[#1a1a1a] scale-125' : 'bg-[#e5e5e5] hover:bg-[#d4d4d4]'}
                            `} />
                        </button>
                    ))}
                </div>
            </div>

        </section>
    );
}
