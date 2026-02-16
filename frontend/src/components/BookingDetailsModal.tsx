'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Ticket, CreditCard, User, FileText, CheckCircle2, Hourglass, XCircle, Clock } from 'lucide-react';
import { instrumentSerif } from '@/lib/fonts';
import Image from 'next/image';

// Define interface matching the Booking type from page.tsx (or a subset relevant for display)
interface BookingDetail {
    id: string;
    eventId: string;
    totalAmount: number;
    finalAmount: number;
    paymentStatus: string;
    createdAt: string;
    isWaitlisted: boolean;
    formResponse: Record<string, any>; // Added formResponse
    event: {
        name: string;
        date: string | null;
        bannerUrl: string | null;
        location: string;
    };
    tickets: {
        id: string;
        name: string;
        price: number;
        quantity: number;
        type: string;
    }[];
}

interface BookingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: BookingDetail | null;
}

export default function BookingDetailsModal({ isOpen, onClose, booking }: BookingDetailsModalProps) {
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [isOpen]);

    if (!booking) return null;

    const getStatusConfig = () => {
        // ... (existing code, relying on finding matching closing brace/lines in context if possible, but for safety I will include the full start of function to match correctly or just target the useEffect and the JSX)
        if (booking.isWaitlisted) {
            return {
                label: 'Waitlist',
                icon: Hourglass,
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                border: 'border-blue-100'
            };
        }
        if (booking.paymentStatus === 'success' || booking.paymentStatus === 'paid') {
            return {
                label: 'Confirmed',
                icon: CheckCircle2,
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                border: 'border-emerald-100'
            };
        }
        if (booking.paymentStatus === 'pending') {
            return {
                label: 'Pending',
                icon: Clock,
                bg: 'bg-amber-50',
                text: 'text-amber-600',
                border: 'border-amber-100'
            };
        }
        return {
            label: booking.paymentStatus,
            icon: XCircle,
            bg: 'bg-gray-50',
            text: 'text-gray-600',
            border: 'border-gray-100'
        };
    };

    const status = getStatusConfig();
    const StatusIcon = status.icon;

    const eventDate = booking.event.date ? new Date(booking.event.date) : null;
    const bookingDate = new Date(booking.createdAt);

    // Format form response keys to be more readable (e.g., "full_name" -> "Full Name")
    const formatLabel = (key: string) => {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-black/5 rounded-full backdrop-blur-md transition-colors z-10 border border-white/20"
                            >
                                <X size={20} className="text-[#1a1a1a]" />
                            </button>

                            {/* Header Gradient */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/10 to-transparent pointer-events-none z-0" />

                            <div className="flex-1 overflow-y-auto overscroll-contain">
                                {/* Event Banner */}
                                <div className="relative h-48 md:h-64 shrink-0 bg-gray-100">
                                    {booking.event.bannerUrl ? (
                                        <Image
                                            src={booking.event.bannerUrl}
                                            alt={booking.event.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Calendar size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6 text-white">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md border border-white/20 mb-3`}>
                                            <StatusIcon size={14} />
                                            <span>{status.label}</span>
                                        </div>
                                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl leading-tight`}>
                                            {booking.event.name}
                                        </h2>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 md:p-8 space-y-8">

                                    {/* Key Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-gray-50 rounded-xl shrink-0">
                                                    <Calendar className="w-5 h-5 text-[#1a1a1a]" />
                                                </div>
                                                <div>
                                                    <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-0.5">Date & Time</p>
                                                    {eventDate ? (
                                                        <>
                                                            <p className="font-medium text-[#1a1a1a]">{eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                            <p className="text-sm text-[#1a1a1a]/70 mt-0.5">{eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                                                        </>
                                                    ) : (
                                                        <p className="font-medium text-[#1a1a1a]">Date TBD</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-gray-50 rounded-xl shrink-0">
                                                    <MapPin className="w-5 h-5 text-[#1a1a1a]" />
                                                </div>
                                                <div>
                                                    <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-0.5">Location</p>
                                                    <p className="font-medium text-[#1a1a1a]">{booking.event.location}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-gray-50 rounded-xl shrink-0">
                                                    <FileText className="w-5 h-5 text-[#1a1a1a]" />
                                                </div>
                                                <div>
                                                    <p className="font-montserrat text-xs uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-0.5">Booking ID</p>
                                                    <p className="font-mono text-[#1a1a1a] bg-gray-50 px-2 py-0.5 rounded text-sm inline-block border border-gray-100">
                                                        {booking.id.toUpperCase()}
                                                    </p>
                                                    <p className="text-xs text-[#1a1a1a]/50 mt-1">
                                                        Booked on {bookingDate.toLocaleDateString('en-US')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100" />

                                    {/* Ticket & Payment Info - Only if NOT waitlisted (or handle waitlist display) */}
                                    {!booking.isWaitlisted ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Tickets */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Ticket className="w-4 h-4 text-[#1a1a1a]" />
                                                    <h3 className="font-montserrat text-sm uppercase tracking-widest font-bold text-[#1a1a1a]">Tickets</h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {booking.tickets.map((ticket) => (
                                                        <div key={ticket.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                            <div>
                                                                <p className="font-bold text-[#1a1a1a] text-sm">{ticket.name}</p>
                                                                <p className="text-xs text-[#1a1a1a]/60 font-mono">Qty: {ticket.quantity}</p>
                                                            </div>
                                                            <div className="font-medium text-[#1a1a1a]">
                                                                {ticket.price > 0 ? `₹${ticket.price * ticket.quantity}` : 'Free'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {booking.tickets.length === 0 && (
                                                        <p className="text-sm text-gray-400 italic">No specific ticket info.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Payment Summary */}
                                            <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CreditCard className="w-4 h-4 text-[#1a1a1a]" />
                                                    <h3 className="font-montserrat text-sm uppercase tracking-widest font-bold text-[#1a1a1a]">Payment Summary</h3>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-[#1a1a1a]/60">Total Amount</span>
                                                        <span className="font-medium">₹{booking.totalAmount}</span>
                                                    </div>
                                                    {booking.totalAmount > booking.finalAmount && (
                                                        <div className="flex justify-between text-sm text-emerald-600">
                                                            <span>Discount</span>
                                                            <span>-₹{(booking.totalAmount - booking.finalAmount).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div className="h-px bg-gray-200 my-2" />
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-bold text-[#1a1a1a]">Total Paid</span>
                                                        <span className={`${instrumentSerif.className} text-2xl text-[#1a1a1a]`}>
                                                            {booking.finalAmount > 0 ? `₹${booking.finalAmount}` : 'Free'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
                                            <Hourglass className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                                            <h3 className="font-bold text-blue-900 mb-1">You are on the Waitlist</h3>
                                            <p className="text-sm text-blue-700">
                                                We will notify you via email if a spot opens up. No payment has been charged yet.
                                            </p>
                                        </div>
                                    )}

                                    {/* Form Responses */}
                                    {booking.formResponse && Object.keys(booking.formResponse).length > 0 && (
                                        <>
                                            <div className="h-px bg-gray-100" />
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User className="w-4 h-4 text-[#1a1a1a]" />
                                                    <h3 className="font-montserrat text-sm uppercase tracking-widest font-bold text-[#1a1a1a]">Registration Details</h3>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.entries(booking.formResponse).map(([key, value]) => (
                                                        <div key={key} className="p-3 rounded-xl border border-gray-100 bg-white">
                                                            <p className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/50 font-bold mb-1">
                                                                {formatLabel(key)}
                                                            </p>
                                                            <p className="text-sm font-medium text-[#1a1a1a] break-words">
                                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
