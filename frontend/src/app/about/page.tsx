'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { instrumentSerif } from '@/lib/fonts';

const container = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const wordAnim = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
    },
};

export default function AboutPage() {
    return (
        <main className="min-h-screen relative bg-white">
            {/* Background Image Banner */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
                style={{ backgroundImage: 'url("/event_bg.png")' }}
            />

            <div className="relative z-10 pt-[120px] pb-32">
                {/* Hero Section */}
                <section className="mb-24 px-4 md:px-12 lg:px-16 text-center lg:text-left">
                    <div className="max-w-4xl mx-auto lg:mx-0">
                        <motion.h1
                            className={`${instrumentSerif.className} text-[#1a1a1a] text-[12vw] md:text-[7.5vw] lg:text-[7vw] xl:text-[5.5vw] leading-[1] md:leading-[0.95] tracking-[-0.02em]`}
                            variants={container}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.3 }}
                        >
                            <div className="block">
                                {['Everything'].map((word, i) => (
                                    <motion.span
                                        key={`title-${i}`}
                                        variants={wordAnim}
                                        className="inline-block mr-[0.3em]"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </div>
                            <div className="block text-[#1a1a1a]/40">
                                {['About', 'Us'].map((word, i) => (
                                    <motion.span
                                        key={`subtitle-${i}`}
                                        variants={wordAnim}
                                        className="inline-block mr-[0.3em]"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.h1>
                    </div>
                </section>

                {/* Introduction Section */}
                <section className="px-4 md:px-12 lg:px-16 mb-32">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-2xl md:text-3xl lg:text-4xl leading-relaxed font-light text-[#1a1a1a]"
                        >
                            <p className="mb-12">
                                <span className={`${instrumentSerif.className} text-4xl md:text-5xl italic`}>Akar Women Group</span> is a dynamic platform dedicated to women empowerment and holistic child development. Founded with the vision of creating a supportive ecosystem, the group brings together inspiring women from diverse fields to learn, grow, and uplift one another.
                            </p>
                            <p className="mb-12 text-[#1a1a1a]/80">
                                Through events, workshops, community initiatives, and meaningful collaborations, Akar Women Group nurtures leadership, confidence, and social responsibility—while also focusing on the growth and values of the next generation.
                            </p>

                        </motion.div>
                    </div>
                </section>

                {/* Vision & Mission Section */}
                <section className="px-4 md:px-12 lg:px-16 mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="bg-[#f8f8f8] p-10 md:p-14 rounded-[2.5rem]"
                        >
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#1a1a1a]/40 mb-6 block">Our Vision</span>
                            <h3 className={`${instrumentSerif.className} text-4xl md:text-5xl text-[#1a1a1a] mb-6`}>
                                A Supportive Ecosystem
                            </h3>
                            <p className="text-lg text-[#1a1a1a]/70 leading-relaxed font-light">
                                To create a world where every woman is empowered to lead, and every child is nurtured to thrive, fostering a global community grounded in growth, unity, and shared success.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-[#1a1a1a] p-10 md:p-14 rounded-[2.5rem] text-white"
                        >
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/40 mb-6 block">Our Mission</span>
                            <h3 className={`${instrumentSerif.className} text-4xl md:text-5xl text-white mb-6`}>
                                Nurturing Leadership
                            </h3>
                            <p className="text-lg text-white/70 leading-relaxed font-light">
                                To bring together inspiring women from diverse fields to learn, uplift one another, and nurture the next generation through impactful events, workshops, and meaningful community initiatives.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Core Goals Section */}
                <section className="px-4 md:px-12 lg:px-16 pb-32">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-16 text-center"
                        >
                            <h2 className={`${instrumentSerif.className} text-5xl md:text-6xl text-[#1a1a1a] mb-4`}>Core Goals</h2>
                            <p className="text-[#1a1a1a]/40 uppercase tracking-[0.2em] text-xs font-bold">What drives us forward</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { title: "Empowerment", desc: "Fostering leadership and confidence through shared experiences and mentorship." },
                                { title: "Child Development", desc: "Instilling strong values and holistic growth in the next generation." },
                                { title: "Community", desc: "Creating a supportive network that celebrates strength, unity, and purpose." },
                                { title: "Social Impact", desc: "Driving meaningful change through collaborative and responsible initiatives." }
                            ].map((goal, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="border border-[#1a1a1a]/10 p-8 rounded-3xl hover:bg-[#f8f8f8] transition-colors duration-500"
                                >
                                    <span className={`${instrumentSerif.className} text-5xl text-[#1a1a1a]/10 mb-6 block`}>0{index + 1}</span>
                                    <h4 className="text-xl font-medium text-[#1a1a1a] mb-3">{goal.title}</h4>
                                    <p className="text-[#1a1a1a]/60 text-sm leading-relaxed">{goal.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
