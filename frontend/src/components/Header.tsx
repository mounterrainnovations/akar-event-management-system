'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Ticket, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const primaryNavItems = [
    { name: 'Work', href: '/work' },
    { name: 'Events', href: '/events' },
    { name: 'Highlights', href: '/highlights' },
    { name: 'Publications', href: '/Publications' }
];

const secondaryNavItems = [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
];

export default function Header() {
    const pathname = usePathname();
    const isEventPage = pathname === '/event';
    const isWorkPage = pathname === '/work';
    const isContactPage = pathname === '/contact';
    const isHighlightsPage = pathname === '/highlights';
    const isAboutPage = pathname === '/about';
    const isEventsPage = pathname === '/events';
    const isPublicationsPage = pathname === '/Publications';
    const isDarkTextPage = isEventPage || isWorkPage || isContactPage || isHighlightsPage || isAboutPage || isEventsPage || isPublicationsPage;

    const [isHidden, setIsHidden] = useState(false);
    const [isPastHero, setIsPastHero] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, isAuthenticated, openAuthModal, logout } = useAuth();
    const { showToast } = useToast();

    const handleLogout = async () => {
        await logout();
        showToast('Signed out successfully.', 'info');
    };

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Check if past hero section (roughly one viewport height)
            setIsPastHero(currentScrollY > window.innerHeight * 0.7);

            // Hide header when scrolling down, show when scrolling up
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsHidden(true);
            } else {
                setIsHidden(false);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);
    const textColor = isDarkTextPage ? 'text-[#1a1a1a]' : (!isPastHero ? 'text-white' : 'text-[#1a1a1a]');
    const separatorBg = isDarkTextPage ? 'bg-[#1a1a1a]' : (!isPastHero ? 'bg-white' : 'bg-[#1a1a1a]');

    return (
        <>
            {/* Permanent blur strip — always visible */}
            <div
                className="fixed top-0 left-0 right-0 z-40 h-[80px] backdrop-blur-md pointer-events-none"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
                }}
            />

            {/* Header content — hides on scroll down */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isHidden ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                    }`}
            >
                <div className="w-full px-8 md:px-12 lg:px-16 flex items-center justify-between h-[80px]">
                    {/* Logo */}
                    <Link href="/" className="flex items-center shrink-0">
                        <span
                            className={`${textColor} uppercase font-instrument transition-colors duration-500`}
                            style={{ fontSize: '30px', letterSpacing: '0.5px' }}
                        >
                            AKAR WOMEN GROUP
                        </span>
                    </Link>


                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center">
                        {primaryNavItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-[16px] ${textColor} font-normal tracking-[0.02em] px-[16px] transition-colors duration-500 hover:opacity-70`}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Separator — small horizontal dash */}
                        <span className={`w-[18px] h-[1.5px] ${separatorBg} rounded-full mx-[10px] transition-colors duration-500`} />

                        {secondaryNavItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-[16px] ${textColor} font-normal tracking-[0.02em] px-[16px] transition-colors duration-500 hover:opacity-70`}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Auth Section */}
                        <div className="ml-4 pl-4 border-l border-gray-200/20">
                            {isAuthenticated && user ? (
                                <div className="relative group">
                                    <button className="flex items-center gap-2 focus:outline-none">
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </button>

                                    {/* Dropdown */}
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] py-2 border border-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right translate-y-2 group-hover:translate-y-0">
                                        <div className="px-5 py-4 border-b border-black/5 mb-1">
                                            <p className="text-xs font-black uppercase tracking-widest text-black/20 mb-1">Signed in as</p>
                                            <p className="text-sm font-bold text-[#1a1a1a] truncate">{user.name}</p>
                                        </div>

                                        <Link
                                            href="/my-bookings"
                                            className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-black/5 transition-all"
                                        >
                                            <Ticket className="w-4 h-4" />
                                            My Bookings
                                        </Link>

                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-black/5 transition-all"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </Link>

                                        <div className="h-[1px] bg-black/5 my-1 mx-5" />

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-all text-left"
                                        >
                                            <X className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={openAuthModal}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${(isPastHero || isDarkTextPage) ? 'border-gray-900/10 hover:bg-gray-900/5' : 'border-white/20 hover:bg-white/10'} transition-all duration-300 group`}
                                    aria-label="Login"
                                >
                                    <User className={`w-4 h-4 ${textColor} group-hover:scale-110 transition-transform`} />
                                </button>
                            )}
                        </div>
                    </nav>



                    {/* Mobile Toggle */}
                    <button
                        className={`md:hidden p-2 ${textColor} transition-colors duration-500`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="md:hidden bg-[#1a1a1a]/95 backdrop-blur-md border-t border-white/5"
                        >
                            <nav className="flex flex-col px-8 py-6 gap-1">
                                {primaryNavItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="text-white/70 text-[14px] font-normal py-2.5 hover:text-white transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                <div className="w-8 h-[1px] bg-white/15 my-3" />
                                {secondaryNavItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="text-white/70 text-[14px] font-normal py-2.5 hover:text-white transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
}
