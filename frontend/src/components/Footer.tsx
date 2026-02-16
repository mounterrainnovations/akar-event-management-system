'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { instrumentSerif } from '@/lib/fonts';
import { ArrowUpRight, Instagram, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
    const pathname = usePathname();
    const isBookingPage = pathname?.startsWith('/booking/');
    const isWhitePage = pathname === '/work' || pathname === '/event' || pathname === '/contact' || pathname === '/highlights' || pathname === '/about' || pathname === '/events' || pathname === '/privacy-policy' || pathname === '/legal' || pathname === '/terms' || pathname === '/refund-policy' || isBookingPage;

    return (
        <footer className={`relative w-full z-10 ${isWhitePage ? 'bg-white' : ''}`}>
            {/* Main Content Section - Solid Dark Background with Rounded Top */}
            <div className="bg-[#483D3F] text-white py-16 rounded-t-[3rem]">
                <div className="max-w-[95vw] md:max-w-7xl mx-auto px-4 md:px-12 lg:px-16">

                    {/* 1. Large CTA Section with Socials */}
                    <div className="border-b border-white/10 pb-16 mb-16">
                        <h2 className={`${instrumentSerif.className} text-[10vw] md:text-[8vw] leading-[0.8] tracking-[-0.02em] text-white mb-8`}>
                            Akar Women Group                        </h2>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                            <div className="space-y-8">
                                <p className="font-montserrat text-white/60 text-lg md:text-xl max-w-md font-light">
                                    Join our movement to empower women and nurture the next generation. Together, let&apos;s build a brighter future.
                                </p>

                                {/* Social Icons integrated here */}
                                <div className="flex gap-4">
                                    <a href="https://www.instagram.com/akar_womengroup" className="text-white hover:text-white/70 transition-colors p-2 border border-white/10 hover:border-white rounded-full">
                                        <Instagram size={20} />
                                    </a>
                                    {/* <a href="#" className="text-white hover:text-white/70 transition-colors p-2 border border-white/10 hover:border-white rounded-full">
                                        <Linkedin size={20} />
                                    </a> */}
                                    <a href="#" className="text-white hover:text-white/70 transition-colors p-2 border border-white/10 hover:border-white rounded-full">
                                        <Twitter size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Grid Links Section - 3 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 pb-20 border-b border-white/10">

                        {/* Column 1: Contact */}
                        <div className="space-y-6">
                            <h3 className="font-montserrat text-xs uppercase tracking-widest text-white/40 font-bold">Contact</h3>
                            <div className="font-montserrat text-base text-white/80 space-y-1">
                                <p>akarwomengroup@gmail.com</p>
                                <p>+9175093 83159</p>
                            </div>
                            <div className="font-montserrat text-base text-white/80 pt-4">
                                <p>4, Sajida Nagar Karbala Road </p>
                                <p>Behind Mayor House, Bhopal 462001</p>
                            </div>
                        </div>

                        {/* Column 2: Explore */}
                        <div className="space-y-6">
                            <h3 className="font-montserrat text-xs uppercase tracking-widest text-white/40 font-bold">Explore</h3>
                            <ul className="space-y-4 font-montserrat text-base text-white/80">
                                <li><Link href="/events" className="hover:text-white transition-colors block">Events</Link></li>
                                <li><Link href="/about" className="hover:text-white transition-colors block">About</Link></li>
                                <li><Link href="/contact" className="hover:text-white transition-colors block">Contact</Link></li>
                                <li><Link href="/refund-policy" className="hover:text-white transition-colors block">Refunds and cancellation</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Newsletter */}
                        <div className="space-y-6">
                            <h3 className="font-montserrat text-xs uppercase tracking-widest text-white/40 font-bold">Newsletter</h3>
                            <p className="font-montserrat text-white/60 text-sm mb-4">
                                Stay updated with our latest events and community initiatives.
                            </p>
                            <form className="flex w-full border-b border-white/20 pb-2 focus-within:border-white transition-colors">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="flex-1 bg-transparent border-none text-white placeholder:text-white/30 focus:outline-none focus:ring-0 px-0 font-montserrat text-base"
                                />
                                <button className="text-white hover:text-white/60 transition-colors">
                                    <ArrowUpRight size={18} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* 3. Bottom Bar */}
                    {/* 3. Bottom Bar */}
                    <div className="py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 font-montserrat text-xs uppercase tracking-wider text-white/40 border-t border-white/10 mt-12 md:mt-20">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full md:w-auto">
                            <p className="whitespace-nowrap">© 2026 Akar Women Group</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                                <Link href="/legal" className="hover:text-white transition-colors">Legal Notice</Link>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="whitespace-nowrap">Website managed by</span>
                            <a
                                href="https://mounterra.in"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-white/80 transition-colors border-b border-white/20 hover:border-white pb-0.5"
                            >
                                Mounterra Innovation
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer >
    );
}
