'use client';

import { instrumentSerif } from '@/lib/fonts';
import EventCarousel from '@/components/EventCarousel';

export default function EventPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Hero Wrapper with background image */}
            <div
                className="relative w-full bg-cover bg-top bg-no-repeat"
                style={{ backgroundImage: "url('/event_bg.png')" }}
            >
                {/* Carousel Section - First */}
                <section className="pt-32 pb-4">
                    <EventCarousel />
                </section>

                {/* Event Title Section - Second */}
                <section className="pb-16 text-center px-4">
                    <div className="flex flex-col items-center">
                        <h1 className={`${instrumentSerif.className} text-[#1a1a1a] text-[8vw] md:text-[6vw] lg:text-[5vw] leading-[1] text-center mb-4`}>
                            Future of Design Summit
                        </h1>
                        <div className="flex flex-col gap-1 text-[#1a1a1a] text-lg md:text-xl font-medium tracking-wide items-center font-montserrat">
                            <p>October 24, 2026</p>
                            <p>New York City, NY</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Event Details Content - Third */}
            <section className="bg-white pb-48 px-4 md:px-12 lg:px-16" id="details">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-16">
                        {/* About */}
                        <div>
                            <h2 className={`${instrumentSerif.className} text-[#1a1a1a] text-4xl mb-6`}>
                                About the Event
                            </h2>
                            <p className="font-montserrat text-[#1a1a1a]/80 text-lg leading-relaxed">
                                Join us for the Future of Design Summit, a premier gathering of creative minds,
                                innovators, and industry leaders. We&apos;ll explore emerging trends in digital art,
                                sustainable architecture, and human-centric design. Expect keynote speeches,
                                interactive workshops, and networking opportunities that will shape the future
                                of our creative landscape.
                            </p>
                        </div>

                        {/* Terms and Conditions */}
                        <div>
                            <h3 className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl mb-4`}>
                                Terms and Conditions
                            </h3>
                            <ul className="list-disc pl-5 font-montserrat text-[#1a1a1a]/70 text-base space-y-3">
                                <li>Tickets are non-refundable but transferable up to 48 hours before the event.</li>
                                <li>Attendees must present a valid ID upon entry.</li>
                                <li>The organizers reserve the right to change the schedule or speakers.</li>
                                <li>By attending, you consent to photography and video recording for promotional use.</li>
                            </ul>
                        </div>

                        {/* Location Map */}
                        <div>
                            <h3 className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl mb-6`}>
                                Location
                            </h3>
                            <p className="font-montserrat text-[#1a1a1a]/80 text-lg mb-4 flex items-center gap-2">
                                <span className="font-semibold">The Grand Hall</span> — 123 Creative Avenue, New York City, NY 10001
                            </p>
                            <div className="w-full h-[400px] rounded-3xl overflow-hidden shadow-lg border border-gray-100 relative grayscale hover:grayscale-0 transition-all duration-500">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1841334465492!2d-73.9877312845936!3d40.75890997932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1677685675402!5m2!1sen!2sus"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-32 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 space-y-8">

                            {/* Date & Time */}
                            <div className="space-y-6">
                                <div>
                                    <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-2">Date</p>
                                    <p className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl`}>October 24, 2026</p>
                                </div>
                                <div>
                                    <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-2">Time</p>
                                    <p className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl`}>10:00 AM – 6:00 PM</p>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* Age Limit */}
                            <div>
                                <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-2">Age Limit</p>
                                <p className={`${instrumentSerif.className} text-[#1a1a1a] text-3xl`}>18+</p>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* Price */}
                            <div>
                                <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-2">Price</p>
                                <div className="flex items-baseline gap-2">
                                    <p className={`${instrumentSerif.className} text-[#1a1a1a] text-5xl`}>$299</p>
                                    <span className="font-montserrat text-sm text-[#1a1a1a]/50">/ person</span>
                                </div>
                            </div>

                            {/* CTA */}
                            <button className="w-full py-5 rounded-full bg-[#1a1a1a] text-white font-montserrat font-semibold tracking-wide hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-black/10">
                                Book Now
                            </button>

                            <p className="font-montserrat text-xs text-center text-[#1a1a1a]/40">
                                Limited seats available
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
