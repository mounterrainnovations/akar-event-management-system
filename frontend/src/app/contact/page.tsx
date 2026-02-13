'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { instrumentSerif } from '@/lib/fonts';
import { Mail, Phone, MapPin } from 'lucide-react';

const contactInfo = [
    {
        icon: <Mail size={24} strokeWidth={1.5} />,
        label: "Email",
        value: "akarwomengroup@gmail.com",
        href: "mailto:akarwomengroup@gmail.com",
        display: "akarwomengroup@gmail.com"
    },
    {
        icon: <Phone size={24} strokeWidth={1.5} />,
        label: "Phone",
        value: "+917509383159",
        href: "tel:+917509383159",
        display: "+91 75093 83159"
    },
    {
        icon: <MapPin size={24} strokeWidth={1.5} />,
        label: "Office",
        value: "4, Sajida Nagar Karbala Road, Behind Mayor House, Bhopal 462001",
        href: null,
        display: "4, Sajida Nagar Karbala Road, Behind Mayor House, Bhopal 462001"
    }
];

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

const people = [
    { name: 'Mihai Toma', role: 'Partner' },
    { name: 'Jack Smethurst', role: 'Partner' },
    { name: 'Leon Brown', role: 'Partner' },
    { name: 'Sarah Jenkins', role: 'Creative Director' },
    { name: 'David Chen', role: 'Head of Strategy' },
    { name: 'Elena Rodriguez', role: 'Experience Lead' },
    { name: 'Alex Wong', role: 'Senior Developer' },
];

export default function ContactPage() {
    const scrollingItems = [...people, ...people];

    return (
        <main className="min-h-screen relative bg-white">
            {/* Background Image - Subtle Banner */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
                style={{ backgroundImage: 'url("/contact_banner.png")' }}
            />

            <div className="relative z-10 pt-[100px] pb-16">
                {/* Hero Section */}
                <section className="mb-16 px-4 md:px-12 lg:px-16 text-center lg:text-left">
                    <div className="max-w-4xl mx-auto lg:mx-0">
                        <motion.h1
                            className={`${instrumentSerif.className} text-[#1a1a1a] text-[12vw] md:text-[7.5vw] lg:text-[7vw] xl:text-[5.5vw] leading-[1] md:leading-[0.95] tracking-[-0.02em]`}
                            variants={container}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: false, amount: 0.3 }}
                        >
                            <div className="block">
                                {['Work', 'with', 'us'].map((word, i) => (
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
                                {['Let\'s', 'talk', 'about', 'your', 'next', 'chapter'].map((word, i) => (
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

                {/* Infinite Scrolling Section - Compacted spacing */}
                <div className="relative w-full overflow-hidden py-12 mb-20">
                    <motion.div
                        className="flex gap-6 whitespace-nowrap"
                        animate={{
                            x: ["0%", "-50%"],
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 30,
                                ease: "linear",
                            },
                        }}
                        style={{ width: "fit-content" }}
                    >
                        {scrollingItems.map((person, index) => (
                            <div
                                key={`${person.name}-${index}`}
                                className="inline-block w-[280px] md:w-[350px] flex-shrink-0"
                            >
                                <div className="bg-[#f0f0f0] aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 flex items-center justify-center relative group cursor-pointer">
                                    <div className="absolute inset-0 bg-gray-200 transition-colors duration-500 group-hover:bg-gray-300" />
                                    <span className="relative z-10 text-gray-400 font-medium tracking-widest text-xs uppercase opacity-50">Photo Placeholder</span>
                                </div>
                                <div className="px-4 text-center lg:text-left">
                                    <h3 className="text-xl md:text-2xl font-semibold text-[#1a1a1a] leading-tight">
                                        {person.name}
                                    </h3>
                                    <p className="text-[#1a1a1a]/40 text-sm md:text-base font-medium">
                                        {person.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>



                {/* Contact Details Section - Premium Grid */}
                <section className="px-4 md:px-12 lg:px-16 mb-24">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {contactInfo.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="group"
                                >
                                    {item.href ? (
                                        <a
                                            href={item.href}
                                            className="flex flex-col items-center text-center p-8 lg:p-10 rounded-[2rem] bg-[#f8f8f8] hover:bg-[#f0f0f0] transition-colors duration-500 h-full"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm text-[#1a1a1a] group-hover:scale-110 transition-transform duration-500">
                                                {item.icon}
                                            </div>
                                            <h3 className={`${instrumentSerif.className} text-2xl mb-2 text-[#1a1a1a]`}>{item.label}</h3>
                                            <p className="text-[#1a1a1a]/70 font-light leading-relaxed group-hover:text-[#1a1a1a] transition-colors">
                                                {item.display}
                                            </p>
                                        </a>
                                    ) : (
                                        <div className="flex flex-col items-center text-center p-8 lg:p-10 rounded-[2rem] bg-[#f8f8f8] h-full">
                                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm text-[#1a1a1a]">
                                                {item.icon}
                                            </div>
                                            <h3 className={`${instrumentSerif.className} text-2xl mb-2 text-[#1a1a1a]`}>{item.label}</h3>
                                            <p className="text-[#1a1a1a]/70 font-light leading-relaxed max-w-[200px]">
                                                {item.display}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Minimalist Compact Contact Form Section with Image Background */}
                <section className="px-4 md:px-12 lg:px-16">
                    <div className="max-w-4xl mx-auto relative rounded-[3rem] overflow-hidden p-10 md:p-16 shadow-2xl">
                        {/* Background Image for the Card */}
                        <Image
                            src="/imageform.png.webp"
                            alt="Contact Background"
                            fill
                            className="object-cover opacity-100 z-0"
                            priority
                        />
                        {/* Subtle Overlay for Legibility - Now Sharp */}
                        <div className="absolute inset-0 bg-white/40 z-1" />

                        <div className="relative z-10 max-w-2xl mx-auto">
                            {/* Header */}
                            <div className="mb-6 text-center">
                                <motion.h2
                                    className={`${instrumentSerif.className} text-6xl md:text-7xl lg:text-8xl leading-none tracking-tight text-[#1a1a1a]`}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    Let&apos;s <span className="italic font-light">connect</span>
                                </motion.h2>
                            </div>



                            {/* Streamlined Form Content */}
                            <motion.form
                                className="space-y-4"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#1a1a1a]/60 ml-1">Name</label>
                                        <input
                                            type="text"
                                            placeholder="Full name"
                                            className="w-full bg-white/60 border border-white/20 rounded-xl px-5 py-3 text-lg font-light text-[#1a1a1a] focus:outline-none focus:bg-white focus:border-[#1a1a1a]/10 transition-all placeholder:text-[#1a1a1a]/30"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#1a1a1a]/60 ml-1">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            className="w-full bg-white/60 border border-white/20 rounded-xl px-5 py-3 text-lg font-light text-[#1a1a1a] focus:outline-none focus:bg-white focus:border-[#1a1a1a]/10 transition-all placeholder:text-[#1a1a1a]/30"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[#1a1a1a]/60 ml-1">Query</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Message"
                                        className="w-full bg-white/60 border border-white/20 rounded-xl px-5 py-3 text-lg font-light text-[#1a1a1a] focus:outline-none focus:bg-white focus:border-[#1a1a1a]/10 transition-all placeholder:text-[#1a1a1a]/30 resize-none"
                                    />
                                </div>

                                <div className="pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.01, backgroundColor: '#000000', color: '#ffffff' }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full bg-[#1a1a1a] text-white font-bold py-4 rounded-xl uppercase tracking-[0.1em] text-xs transition-all duration-300 shadow-lg"
                                    >
                                        Submit
                                    </motion.button>
                                </div>
                            </motion.form>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
