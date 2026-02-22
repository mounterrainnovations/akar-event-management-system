'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { instrumentSerif } from '@/lib/fonts';

const journeyData = [
    {
        year: '2022',
        title: 'Where Courage Found Its Space',
        description: 'AKAR began with a simple truth: empowered women create empowered communities. It started as a safe space where women could speak freely, rebuild confidence, and support one another. There were no headlines, only heartfelt conversations. In those quiet moments, the foundation of change was laid.',
        // Using a sophisticated abstract/minimalist image as placeholder
        image: '/2022.jpeg'
    },
    {
        year: '2023',
        title: 'Empowerment in Action',
        description: 'By 2023, the circle had grown stronger. Women from different backgrounds came together, sharing experiences and lifting each other higher. Conversations turned into collaboration and mentorship. Confidence became action. Empowerment was no longer a concept—it was visible in every woman who stepped forward.',
        image: '/2023.jpeg'
    },
    {
        year: '2024',
        title: 'Stories That Changed Narratives',
        description: 'In 2024, AKAR amplified powerful stories of resilience through its magazine and community platforms. Women who once faced doubt began leading with courage and clarity. Their journeys inspired others to believe in themselves. Empowerment expanded beyond celebration—it began shaping the next generation.',
        image: '/2024.jpg'
    },
    {
        year: '2025',
        title: 'Recognition That Inspired Many',
        description: 'The “Manzile Aur Hum – Women Achievers Award 2025” honored women who created real impact. It was a moment of pride, recognition, and collective strength. Each award celebrated perseverance and leadership. Empowerment stepped onto a larger stage.',
        image: '/2025.jpg'
    },
    {
        year: '2026',
        title: 'A Movement Creating Lasting Change',
        description: 'By 2026, AKAR evolved into a movement driving meaningful change. It stands as a platform for leadership, mentorship, and opportunity. What began as a belief is now shaping confident women and stronger communities. The journey continues with purpose and power.',
        image: '/2026.png'
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
                            w-[85vw] md:w-[900px] h-[580px] md:h-[500px]
                            rounded-[30px] overflow-hidden
                            transition-all duration-500
                            ${activeIndex === index ? 'opacity-100 scale-100' : 'opacity-40 scale-95 grayscale'}
                        `}
                    >
                        <div className="flex flex-col md:flex-row w-full h-full">
                            {/* Top/Left Side - Image/Visual */}
                            <div className="w-full h-[40%] md:h-full md:w-1/2 bg-black relative flex items-end justify-center overflow-hidden shrink-0">
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

                            {/* Bottom/Right Side - Content */}
                            <div className="w-full h-[60%] md:h-full md:w-1/2 bg-[#1a1a1a] p-6 md:p-12 flex flex-col relative text-white">
                                {/* Year at top */}
                                <div className={`${instrumentSerif.className} text-5xl md:text-8xl mb-2 md:mb-auto`}>
                                    {item.year}
                                </div>

                                {/* Content at bottom */}
                                <div className="flex flex-col gap-2 md:gap-6 overflow-y-auto scrollbar-hide pb-2">
                                    <h3 className={`${instrumentSerif.className} text-2xl md:text-4xl leading-tight`}>
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
