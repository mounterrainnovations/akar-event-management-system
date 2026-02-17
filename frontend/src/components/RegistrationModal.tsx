'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle, Upload, Trash2, Tag, ChevronRight, ChevronLeft } from 'lucide-react';
import { instrumentSerif } from '@/lib/fonts';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Ticket {
    id: string;
    description: any;
    price: number;
    quantity: number | null;
    soldCount: number;
    status: string;
    maxQuantityPerPerson: number;
    visibilityConfig?: Record<string, string[]>;
}

interface FormField {
    id: string;
    fieldName: string;
    label: string;
    fieldType: string;
    isRequired: boolean;
    isHidden?: boolean; // New: Conditional
    options: any;
    displayOrder: number;
}

interface BundleOffer {
    id: string;
    name: string;
    buyQuantity: number;
    getQuantity: number;
    offerType: string;
    applicableTicketIds: string[] | null;
}

interface Coupon {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
}

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBookingCreated?: (mode: 'payment' | 'waitlist') => void;
    eventId: string;
    eventName: string;
    tickets: Ticket[];
    formFields: FormField[];
    bundleOffers: BundleOffer[];
    backendUrl: string;
    eventStatus?: string;
    existingWaitlistBooking?: {
        id: string;
        formResponse: Record<string, unknown>;
    } | null;
}

export default function RegistrationModal({
    isOpen,
    onClose,
    onBookingCreated,
    eventId,
    eventName,
    tickets,
    formFields,
    bundleOffers,
    backendUrl,
    eventStatus,
    existingWaitlistBooking
}: RegistrationModalProps) {
    const { user, isAuthenticated, openAuthModal } = useAuth();
    const [step, setStep] = useState(1);
    const [formValues, setFormValues] = useState<Record<string, any>>({
        name: '',
        phone: '',
        email: ''
    });
    const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [bookingMode, setBookingMode] = useState<'payment' | 'waitlist' | null>(null);

    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [dragOverField, setDragOverField] = useState<string | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const shouldLogPaymentFlow =
        process.env.NODE_ENV !== 'production' ||
        process.env.NEXT_PUBLIC_PAYMENT_FLOW_DEBUG === 'true';

    const prefilledFormValues = useMemo(() => {
        if (eventStatus !== 'published' || !existingWaitlistBooking?.id) {
            return null;
        }

        const source = existingWaitlistBooking.formResponse || {};
        const prefilled: Record<string, any> = {
            ...source,
            name: typeof source.name === 'string' ? source.name : '',
            email: typeof source.email === 'string' ? source.email : '',
            phone: typeof source.phone === 'string' ? source.phone : '',
        };

        return prefilled;
    }, [eventStatus, existingWaitlistBooking]);

    function logPaymentFlow(step: string, details?: Record<string, unknown>) {
        if (!shouldLogPaymentFlow) return;
        if (details) {
            console.info(`[payment-flow] ${step}`, details);
            return;
        }
        console.info(`[payment-flow] ${step}`);
    }

    // Initializations and Scroll Locking
    React.useLayoutEffect(() => {
        if (isOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

            const originalBodyOverflow = document.body.style.overflow;
            const originalBodyPadding = document.body.style.paddingRight;
            const originalHtmlOverflow = document.documentElement.style.overflow;

            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }

            setFormValues(prefilledFormValues || { name: '', phone: '', email: '' });
            // Auto-select first ticket by default if nothing is selected
            if (eventStatus !== 'waitlist' && Object.keys(selectedTickets).length === 0 && tickets.length > 0) {
                setSelectedTickets({ [tickets[0].id]: 1 });
            }

            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.body.style.paddingRight = originalBodyPadding;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };

            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.body.style.paddingRight = originalBodyPadding;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        } else {
            setStep(1);
            setFormValues({ name: '', phone: '', email: '' });
            setSelectedTickets({});
            setCouponCode('');
            setAppliedCoupon(null);
            setError(null);
            setRegistrationId(null);
            setPaymentUrl(null);
            setBookingMode(null);
            setShowCloseConfirm(false);
            setOpenDropdown(null);
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, tickets, eventStatus, prefilledFormValues]);

    const hasChanges = useMemo(() => {
        const hasFormValues = Object.values(formValues).some(v => Array.isArray(v) ? v.length > 0 : !!v);
        const hasSelectedTickets = Object.keys(selectedTickets).length > 0;
        return hasFormValues || hasSelectedTickets;
    }, [formValues, selectedTickets]);

    const handleCloseAttempt = () => {
        if (!registrationId && hasChanges) {
            setShowCloseConfirm(true);
        } else {
            onClose();
        }
    };

    const visibleFormFields = useMemo(() => {
        const visibleNames = new Set<string>();

        // 1. Add fields that are NOT hidden
        formFields.forEach(f => {
            if (!f.isHidden) visibleNames.add(f.fieldName);
        });

        // 2. Check for triggers from dropdown selections
        formFields.forEach(field => {
            const currentValue = formValues[field.fieldName];
            if ((field.fieldType === 'dropdown' || field.fieldType === 'select') && currentValue && Array.isArray(field.options)) {
                // Find selected option object
                const selectedOpt = field.options.find((opt: any) => {
                    const optVal = typeof opt === 'string' ? opt : opt.value;
                    // String comparison for safety
                    return String(optVal) === String(currentValue);
                });

                if (selectedOpt && typeof selectedOpt !== 'string' && Array.isArray(selectedOpt.triggers)) {
                    selectedOpt.triggers.forEach((targetName: string) => visibleNames.add(targetName));
                }
            }
        });

        return formFields
            .filter(f => visibleNames.has(f.fieldName))
            .sort((a, b) => a.displayOrder - b.displayOrder);
    }, [formFields, formValues]);

    const visibleTickets = useMemo(() => {
        return tickets.filter(ticket => {
            // If no config, it's visible
            if (!ticket.visibilityConfig || Object.keys(ticket.visibilityConfig).length === 0) {
                return true;
            }

            // Check all rules
            for (const [fieldName, allowedValues] of Object.entries(ticket.visibilityConfig)) {
                // If the controlling field is not answered, or answer is not in allowed list -> Hidden
                const currentAnswer = formValues[fieldName];
                // Handle both string answers and object answers (if any future complexity) - adhering to simple string match for now
                if (!currentAnswer || !allowedValues.includes(String(currentAnswer))) {
                    return false;
                }
            }
            return true;
        });
    }, [tickets, formValues]);

    // Effect: Clean up selected tickets that are no longer visible
    useEffect(() => {
        setSelectedTickets(prev => {
            const visibleIds = new Set(visibleTickets.map(t => t.id));
            const next = { ...prev };
            let hasChanges = false;

            Object.keys(next).forEach(id => {
                if (!visibleIds.has(id)) {
                    delete next[id];
                    hasChanges = true;
                }
            });

            return hasChanges ? next : prev;
        });
    }, [visibleTickets]);

    // Calculations
    const totalBaseAmount = useMemo(() => {
        return Object.entries(selectedTickets).reduce((acc, [id, qty]) => {
            const ticket = tickets.find(t => t.id === id);
            return acc + (ticket?.price || 0) * qty;
        }, 0);
    }, [selectedTickets, tickets]);

    const handleTicketToggle = (ticketId: string) => {
        setSelectedTickets(prev => {
            const newSelected = { ...prev };
            if (newSelected[ticketId]) {
                delete newSelected[ticketId];
            } else {
                newSelected[ticketId] = 1;
            }
            return newSelected;
        });
    };

    const updateTicketQuantity = (ticketId: string, delta: number) => {
        const ticket = tickets.find(t => t.id === ticketId);
        const maxLimit = ticket?.maxQuantityPerPerson || 10; // Default fallback to 10 if undefined

        setSelectedTickets(prev => {
            const currentQty = prev[ticketId] || 0;
            let newQty = currentQty + delta;

            // Enforce limits
            if (newQty < 0) newQty = 0;
            if (newQty > maxLimit) newQty = maxLimit;

            const newSelected = { ...prev };
            if (newQty === 0) {
                delete newSelected[ticketId];
            } else {
                newSelected[ticketId] = newQty;
            }
            return newSelected;
        });
    };

    const bundleInfo = useMemo(() => {
        if (!bundleOffers.length || Object.keys(selectedTickets).length === 0) return { totalDiscount: 0, applied: [], discountPerTicket: {} };

        let totalDiscount = 0;
        const applied: { name: string, freeTickets: number, savings: number }[] = [];
        const discountPerTicket: Record<string, number> = {};

        const ticketPool: { id: string, price: number }[] = [];
        Object.entries(selectedTickets).forEach(([id, qty]) => {
            const ticket = tickets.find(t => t.id === id);
            if (ticket) {
                for (let i = 0; i < qty; i++) {
                    ticketPool.push({ id, price: ticket.price });
                }
            }
        });

        let remainingPool = [...ticketPool];

        const sortedBundles = [...bundleOffers].sort((a, b) =>
            (b.getQuantity / (b.buyQuantity + b.getQuantity)) - (a.getQuantity / (a.buyQuantity + a.getQuantity))
        );

        sortedBundles.forEach(bundle => {
            const applicableInPool = remainingPool.filter(item =>
                !bundle.applicableTicketIds || bundle.applicableTicketIds.includes(item.id)
            );

            const groupSize = bundle.buyQuantity + bundle.getQuantity;
            if (applicableInPool.length >= groupSize) {
                const numSets = Math.floor(applicableInPool.length / groupSize);
                const totalToConsume = numSets * groupSize;
                const freeCount = numSets * bundle.getQuantity;

                applicableInPool.sort((a, b) => a.price - b.price);

                const freeItems = applicableInPool.slice(0, freeCount);
                const consumedSet = applicableInPool.slice(0, totalToConsume);

                const savings = freeItems.reduce((sum, item) => sum + item.price, 0);

                if (savings > 0) {
                    totalDiscount += savings;
                    applied.push({
                        name: bundle.name || `Bundle: Buy ${bundle.buyQuantity} Get ${bundle.getQuantity}`,
                        freeTickets: freeCount,
                        savings
                    });

                    freeItems.forEach(item => {
                        discountPerTicket[item.id] = (discountPerTicket[item.id] || 0) + item.price;
                    });

                    consumedSet.forEach(consumedItem => {
                        const idx = remainingPool.indexOf(consumedItem);
                        if (idx > -1) remainingPool.splice(idx, 1);
                    });
                }
            }
        });

        return { totalDiscount, applied, discountPerTicket };
    }, [selectedTickets, bundleOffers, tickets]);

    const bundleDiscount = bundleInfo.totalDiscount;

    const couponDiscount = useMemo(() => {
        if (!appliedCoupon) return 0;
        const amountAfterBundle = totalBaseAmount - bundleDiscount;
        if (appliedCoupon.discountType === 'percentage') {
            return (amountAfterBundle * appliedCoupon.discountValue) / 100;
        }
        return appliedCoupon.discountValue;
    }, [appliedCoupon, totalBaseAmount, bundleDiscount]);

    const finalAmount = Math.max(0, totalBaseAmount - bundleDiscount - couponDiscount);

    // Handlers
    const handleInputChange = (fieldName: string, value: any) => {
        setFormValues(prev => ({ ...prev, [fieldName]: value }));

        // Auto-map to ticket if the value matches a ticket name
        if (typeof value === 'string') {
            const ticketMatch = tickets.find(t =>
                (t.description?.name || '').toLowerCase() === value.toLowerCase()
            );
            if (ticketMatch) {
                setSelectedTickets(prev => ({ ...prev, [ticketMatch.id]: Math.max(prev[ticketMatch.id] || 0, 1) }));
            }
        }
    };

    const handleCheckboxChange = (fieldName: string, option: string, checked: boolean) => {
        const currentValues = Array.isArray(formValues[fieldName]) ? formValues[fieldName] as string[] : [];
        const newValues = checked
            ? [...currentValues, option]
            : currentValues.filter(v => v !== option);
        handleInputChange(fieldName, newValues);

        // Also check if this option matches a ticket name
        const ticketMatch = tickets.find(t =>
            (t.description?.name || '').toLowerCase() === option.toLowerCase()
        );
        if (ticketMatch) {
            if (checked) {
                setSelectedTickets(prev => ({ ...prev, [ticketMatch.id]: Math.max(prev[ticketMatch.id] || 0, 1) }));
            } else {
                setSelectedTickets(prev => {
                    const next = { ...prev };
                    delete next[ticketMatch.id];
                    return next;
                });
            }
        }
    };

    const handleFileUpload = async (fieldName: string, file: File) => {
        setUploadingField(fieldName);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', `registrations/${eventId}`);

            const response = await fetch(`${backendUrl}/api/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            handleInputChange(fieldName, data.url);
        } catch (err: any) {
            setError('Failed to upload image. Please try again.');
        } finally {
            setUploadingField(null);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsApplyingCoupon(true);
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/api/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, code: couponCode })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Invalid coupon');
            }

            const data = await response.json();
            setAppliedCoupon(data);
            setCouponCode('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            // Validate mandatory fields
            if (!formValues.name || !formValues.email || !formValues.phone) {
                setError('Please fill in mandatory fields (Name, Email, Phone)');
                return;
            }
            // Check custom required fields among VISIBLE ones only
            for (const field of visibleFormFields) {
                if (field.isRequired && !formValues[field.fieldName]) {
                    setError(`Please fill in ${field.label}`);
                    return;
                }
            }
            setError(null);
            if (eventStatus === 'waitlist') {
                handleSubmit();
                return;
            }
            setStep(2);
        }
    };

    async function getBearerToken() {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            throw new Error(sessionError.message || 'Unable to fetch session');
        }

        const accessToken = data.session?.access_token;
        if (!accessToken) {
            throw new Error('Missing access token. Please log in again.');
        }

        return accessToken;
    }

    function buildBookingPayload() {
        const isWaitlist = eventStatus === 'waitlist';
        const existingRegistrationId =
            eventStatus === 'published' ? existingWaitlistBooking?.id : undefined;
        return {
            user_id: user?.id,
            eventId,
            firstName: formValues.name,
            email: formValues.email,
            phone: formValues.phone,
            eventName,
            amount: isWaitlist ? 0 : Number(finalAmount.toFixed(2)),
            tickets_bought: isWaitlist ? {} : selectedTickets,
            coupon_id: appliedCoupon?.id,
            form_response: formValues,
            registrationId: existingRegistrationId,
        };
    }

    const handleSubmit = async () => {
        if (eventStatus !== 'waitlist' && !Object.keys(selectedTickets).length) return;

        if (!isAuthenticated || !user?.id) {
            setError('Please log in to continue with booking.');
            openAuthModal();
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            logPaymentFlow('submit started', {
                eventId,
                eventStatus,
                userId: user?.id || null,
            });
            const accessToken = await getBearerToken();
            logPaymentFlow('auth token fetched', {
                hasToken: Boolean(accessToken),
            });
            const bookingPayload = buildBookingPayload();
            logPaymentFlow('sending booking request', {
                url: `${backendUrl}/api/bookings`,
                eventId: bookingPayload.eventId,
                amount: bookingPayload.amount,
                selectedTicketCount: Object.keys(selectedTickets).length,
                isWaitlist: eventStatus === 'waitlist',
                existingRegistrationId: bookingPayload.registrationId || null,
            });
            const response = await fetch(`${backendUrl}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(bookingPayload)
            });

            const data = await response.json();
            logPaymentFlow('booking response received', {
                httpStatus: response.status,
                ok: response.ok,
                bookingMode: data?.bookingMode || null,
                registrationId: data?.booking?.id || null,
                transactionId: data?.payment?.transactionId || null,
                paymentUrl: data?.payment?.paymentUrl || null,
                error: data?.error || null,
                details: data?.details || null,
            });
            if (!response.ok) {
                console.error('[payment-flow] booking request failed', data);
                throw new Error(data?.details || data?.error || 'Failed to initiate booking');
            }

            const mode = data?.bookingMode === 'waitlist' ? 'waitlist' : 'payment';
            setRegistrationId(data?.booking?.id || null);
            setPaymentUrl(data?.payment?.paymentUrl || null);
            setBookingMode(mode);
            logPaymentFlow('booking state updated', {
                mode,
                registrationId: data?.booking?.id || null,
                transactionId: data?.payment?.transactionId || null,
                hasPaymentUrl: Boolean(data?.payment?.paymentUrl),
            });
            onBookingCreated?.(mode);
        } catch (err: any) {
            console.error('[payment-flow] submit failed', {
                message: err?.message || 'Unknown error',
            });
            setError(err.message);
        } finally {
            logPaymentFlow('submit finished');
            setIsLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden">
                        {/* Fixed Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseAttempt}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
                        />

                        {/* Scrollable Container - Professional Windows-compatible Scrolling Architecture */}
                        <div
                            className="relative w-full h-full overflow-y-auto flex flex-col items-center py-8 md:py-20 px-4 overscroll-contain"
                            onClick={handleCloseAttempt}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden cursor-default shrink-0 flex flex-col mb-8"

                            >
                                {/* Confirmation Overlay */}
                                <AnimatePresence>
                                    {showCloseConfirm && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center p-6 text-center"
                                        >
                                            <div className="space-y-6 max-w-xs">
                                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto"><AlertCircle size={32} /></div>
                                                <div className="space-y-2">
                                                    <h4 className={`${instrumentSerif.className} text-2xl text-[#1a1a1a]`}>Discard Changes?</h4>
                                                    <p className="text-[#1a1a1a]/60 font-montserrat text-[10px] leading-relaxed">All entered information and ticket selections will be lost.</p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button onClick={onClose} className="w-full py-3 rounded-full bg-red-500 text-white font-montserrat font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all">Discard Everything</button>
                                                    <button onClick={() => setShowCloseConfirm(false)} className="w-full py-3 rounded-full bg-[#1a1a1a] text-white font-montserrat font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all">Keep Editing</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Header */}
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                    <div>
                                        <h2 className={`${instrumentSerif.className} text-xl text-[#1a1a1a]`}>{registrationId ? 'Success' : eventName}</h2>
                                        {!registrationId && (
                                            <p className="text-[#1a1a1a]/40 font-montserrat text-[9px] font-bold uppercase tracking-widest mt-0.5">Step {step} of {eventStatus === 'waitlist' ? 1 : 2}</p>
                                        )}
                                    </div>
                                    <button onClick={handleCloseAttempt} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-[#1a1a1a]/40"><X size={18} /></button>
                                </div>

                                {/* Body */}
                                <div className="p-5">
                                    {!registrationId ? (
                                        <>
                                            {step === 1 && (
                                                <div className="space-y-5">
                                                    <div className="space-y-3">
                                                        <p className="font-montserrat text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">Attendee Details</p>
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">Full Name *</label>
                                                                <input required value={formValues.name} onChange={e => handleInputChange('name', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-montserrat text-[#1a1a1a] focus:ring-2 focus:ring-[#1a1a1a]/10 outline-none" placeholder="John Doe" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">Email *</label>
                                                                <input required type="email" value={formValues.email} onChange={e => handleInputChange('email', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-montserrat text-[#1a1a1a] focus:ring-2 focus:ring-[#1a1a1a]/10 outline-none" placeholder="john@example.com" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">Phone Number *</label>
                                                                <input required value={formValues.phone} onChange={e => handleInputChange('phone', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-montserrat text-[#1a1a1a] focus:ring-2 focus:ring-[#1a1a1a]/10 outline-none" placeholder="+91 00000 00000" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {visibleFormFields.length > 0 && (
                                                        <div className="space-y-3 pt-5 border-t border-gray-100">
                                                            <p className="font-montserrat text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">Additional Info</p>
                                                            <div className="space-y-3">
                                                                {visibleFormFields.map((field, idx) => (
                                                                    <div key={`field-${idx}`} className="space-y-1">
                                                                        <label className="text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{field.label} {field.isRequired && '*'}</label>
                                                                        {field.fieldType === 'select' || field.fieldType === 'dropdown' ? (
                                                                            <div className="relative custom-dropdown-container">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setOpenDropdown(openDropdown === field.fieldName ? null : field.fieldName)}
                                                                                    className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-montserrat text-[#1a1a1a] flex items-center justify-between transition-all duration-300 ${openDropdown === field.fieldName ? 'border-[#1a1a1a] shadow-sm ring-1 ring-[#1a1a1a]' : 'border-gray-200 hover:border-gray-400'}`}
                                                                                >
                                                                                    <span className={formValues[field.fieldName] ? "text-[#1a1a1a] font-medium" : "text-[#1a1a1a]/40"}>
                                                                                        {formValues[field.fieldName] || "Select option"}
                                                                                    </span>
                                                                                    <ChevronLeft size={12} className={`text-[#1a1a1a]/40 transform transition-transform duration-300 ${openDropdown === field.fieldName ? 'rotate-90 text-[#1a1a1a]' : '-rotate-90'}`} />
                                                                                </button>

                                                                                <AnimatePresence>
                                                                                    {openDropdown === field.fieldName && (
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                                                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                                                                            className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-56 overflow-y-auto ring-1 ring-black/5 py-1"
                                                                                        >
                                                                                            {field.options?.map((opt: any, optIdx: number) => {
                                                                                                const optValue = typeof opt === 'string' ? opt : opt.value;
                                                                                                const optLabel = typeof opt === 'string' ? opt : opt.label;
                                                                                                const isSelected = formValues[field.fieldName] === optValue;
                                                                                                return (
                                                                                                    <button
                                                                                                        key={`field-${idx}-opt-${optIdx}`}
                                                                                                        type="button"
                                                                                                        onClick={() => {
                                                                                                            handleInputChange(field.fieldName, optValue);
                                                                                                            setOpenDropdown(null);
                                                                                                        }}
                                                                                                        className={`w-full text-left px-4 py-2 text-[10px] font-montserrat transition-all flex items-center justify-between group ${isSelected ? 'bg-[#1a1a1a] text-white' : 'text-[#1a1a1a]/70 hover:bg-gray-50 hover:text-[#1a1a1a]'}`}
                                                                                                    >
                                                                                                        <span className={isSelected ? 'font-bold' : 'font-medium'}>{optLabel}</span>
                                                                                                        {isSelected && <CheckCircle2 size={10} className="text-white" />}
                                                                                                    </button>
                                                                                                );
                                                                                            })}
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>
                                                                        ) : field.fieldType === 'image' || field.fieldType === 'file' || field.fieldType === 'image answer' ? (
                                                                            <div className="space-y-1.5">
                                                                                {formValues[field.fieldName] ? (
                                                                                    <div className="relative group rounded-lg overflow-hidden aspect-video bg-gray-100 border border-gray-200 max-h-24">
                                                                                        <img src={formValues[field.fieldName]} alt="Uploaded" className="w-full h-full object-contain" />
                                                                                        <button onClick={() => handleInputChange(field.fieldName, '')} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <label
                                                                                        onDragOver={(e) => { e.preventDefault(); setDragOverField(field.fieldName); }}
                                                                                        onDragLeave={() => setDragOverField(null)}
                                                                                        onDrop={async (e) => {
                                                                                            e.preventDefault();
                                                                                            setDragOverField(null);
                                                                                            const file = e.dataTransfer.files[0];
                                                                                            if (file) await handleFileUpload(field.fieldName, file);
                                                                                        }}
                                                                                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragOverField === field.fieldName ? 'border-[#1a1a1a] bg-[#1a1a1a]/5' : 'border-gray-200 hover:border-[#1a1a1a]/40 bg-gray-50'}`}
                                                                                    >
                                                                                        <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                                                                            {uploadingField === field.fieldName ? (
                                                                                                <Loader2 className="w-6 h-6 text-[#1a1a1a] animate-spin" />
                                                                                            ) : (
                                                                                                <>
                                                                                                    <Upload className="w-6 h-6 mb-2 text-[#1a1a1a]/40" />
                                                                                                    <p className="mb-1 text-[9px] text-[#1a1a1a]/60 font-bold uppercase tracking-widest">
                                                                                                        Click to upload
                                                                                                    </p>
                                                                                                </>
                                                                                            )}
                                                                                            <input
                                                                                                type="file"
                                                                                                className="hidden"
                                                                                                onChange={(e) => {
                                                                                                    const file = e.target.files?.[0];
                                                                                                    if (file) handleFileUpload(field.fieldName, file);
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </label>
                                                                                )}
                                                                            </div>
                                                                        ) : field.fieldType === 'checkbox' ? (
                                                                            <div className="grid grid-cols-1 gap-1.5">
                                                                                {field.options?.map((opt: any, optIdx: number) => {
                                                                                    const optValue = typeof opt === 'string' ? opt : opt.value;
                                                                                    const optLabel = typeof opt === 'string' ? opt : opt.label;
                                                                                    return (
                                                                                        <label key={`field-${idx}-opt-${optIdx}`} className="flex items-center gap-2 cursor-pointer group">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={(formValues[field.fieldName] as string[] || []).includes(optValue)}
                                                                                                onChange={e => handleCheckboxChange(field.fieldName, optValue, e.target.checked)}
                                                                                                className="w-3.5 h-3.5 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]/10"
                                                                                            />
                                                                                            <span className="text-[10px] text-[#1a1a1a]/70 font-montserrat group-hover:text-[#1a1a1a]">{optLabel}</span>
                                                                                        </label>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        ) : field.fieldType === 'radio' ? (
                                                                            <div className="grid grid-cols-1 gap-1.5">
                                                                                {field.options?.map((opt: any, optIdx: number) => {
                                                                                    const optValue = typeof opt === 'string' ? opt : opt.value;
                                                                                    const optLabel = typeof opt === 'string' ? opt : opt.label;
                                                                                    return (
                                                                                        <label key={`field-${idx}-opt-${optIdx}`} className="flex items-center gap-2 cursor-pointer group">
                                                                                            <input
                                                                                                type="radio"
                                                                                                name={field.fieldName}
                                                                                                checked={formValues[field.fieldName] === optValue}
                                                                                                onChange={() => handleInputChange(field.fieldName, optValue)}
                                                                                                className="w-3.5 h-3.5 border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]/10"
                                                                                            />
                                                                                            <span className="text-[10px] text-[#1a1a1a]/70 font-montserrat group-hover:text-[#1a1a1a]">{optLabel}</span>
                                                                                        </label>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        ) : (
                                                                            <input value={formValues[field.fieldName] || ''} onChange={e => handleInputChange(field.fieldName, e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-montserrat text-[#1a1a1a] outline-none" placeholder={`Enter ${field.label.toLowerCase()}`} />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {step === 2 && (
                                                <div className="space-y-5">
                                                    <div className="space-y-2.5">
                                                        <p className="font-montserrat text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">Select Tickets / Activities</p>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {visibleTickets.map((ticket, idx) => {
                                                                const qty = selectedTickets[ticket.id] || 0;
                                                                const isSelected = qty > 0;

                                                                // Find bundle for this specific ticket
                                                                const ticketBundle = bundleOffers.find(b =>
                                                                    !b.applicableTicketIds || b.applicableTicketIds.includes(ticket.id)
                                                                );

                                                                // Check if this specific ticket benefited from a bundle
                                                                const ticketDiscount = bundleInfo.discountPerTicket?.[ticket.id] || 0;
                                                                const effectiveTotal = (qty * ticket.price) - ticketDiscount;
                                                                const hasBundleSavings = isSelected && ticketDiscount > 0;

                                                                return (
                                                                    <div key={`ticket-${idx}`} className={`w-full p-3 rounded-xl border transition-all ${isSelected ? 'border-[#1a1a1a] bg-[#1a1a1a]/5 ring-1 ring-[#1a1a1a]' : 'border-gray-200 hover:border-gray-400'}`}>
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex-1 cursor-pointer" onClick={() => handleTicketToggle(ticket.id)}>
                                                                                <h3 className="font-montserrat font-bold text-[#1a1a1a] text-xs leading-tight">{ticket.description?.name || 'Entry'}</h3>
                                                                                <p className="text-[10px] text-[#1a1a1a]/60 font-montserrat leading-tight mt-0.5">{ticket.description?.description || 'Access to event'}</p>

                                                                                <div className="mt-3 flex flex-wrap items-end gap-2 px-0.5">
                                                                                    {eventStatus !== 'waitlist' && (
                                                                                        <div className="flex flex-col">
                                                                                            {hasBundleSavings && (
                                                                                                <span className="text-[9px] text-red-500 line-through font-montserrat font-medium leading-none">₹{qty * ticket.price}</span>
                                                                                            )}
                                                                                            <p className={`${instrumentSerif.className} text-xl text-[#1a1a1a] leading-tight`}>
                                                                                                ₹{isSelected ? effectiveTotal : ticket.price}
                                                                                                {!isSelected && <span className="text-[8px] font-montserrat text-[#1a1a1a]/40 ml-1 font-bold uppercase tracking-widest">/ Ticket</span>}
                                                                                            </p>
                                                                                        </div>
                                                                                    )}

                                                                                    {ticketBundle && (
                                                                                        <div className={`text-[8px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider h-fit mb-0.5 ${hasBundleSavings ? 'bg-[#1a1a1a] text-white' : 'bg-amber-100 text-amber-700'}`}>
                                                                                            {hasBundleSavings ? `Applied: -₹${ticketDiscount}` : (eventStatus === 'waitlist' ? 'Waitlist' : (ticketBundle.name || `BUY ${ticketBundle.buyQuantity} GET ${ticketBundle.getQuantity} FREE`))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2.5 ml-4">
                                                                                {isSelected && (
                                                                                    <div className="flex items-center gap-2 bg-gray-100/50 rounded-full px-2 py-0.5">
                                                                                        <button onClick={(e) => { e.stopPropagation(); updateTicketQuantity(ticket.id, -1); }} className="text-[#1a1a1a]/60 hover:text-black transition-colors"><ChevronLeft size={14} /></button>
                                                                                        <span className="font-montserrat font-bold text-[10px] min-w-[12px] text-center text-[#1a1a1a]">{qty}</span>
                                                                                        <button onClick={(e) => { e.stopPropagation(); updateTicketQuantity(ticket.id, 1); }} className="text-[#1a1a1a]/60 hover:text-black transition-colors"><ChevronRight size={14} /></button>
                                                                                    </div>
                                                                                )}
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isSelected}
                                                                                    onChange={() => handleTicketToggle(ticket.id)}
                                                                                    className="w-4 h-4 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]/10"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {Object.keys(selectedTickets).length > 0 && eventStatus !== 'waitlist' && eventStatus !== 'cancelled' && (
                                                        <div className="space-y-4 pt-5 border-t border-gray-100">
                                                            <div className="space-y-2">
                                                                <p className="font-montserrat text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">Promo Code</p>
                                                                <div className="flex gap-2">
                                                                    <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="COUPON" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-montserrat text-[#1a1a1a]" />
                                                                    <button onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponCode} className="px-4 rounded-lg bg-[#1a1a1a] text-white font-montserrat font-bold text-[10px] uppercase tracking-widest disabled:opacity-50">
                                                                        {isApplyingCoupon ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                                                                    </button>
                                                                </div>
                                                                {appliedCoupon && (
                                                                    <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-montserrat font-bold">
                                                                        <div className="flex items-center gap-1.5"><Tag size={12} /> {appliedCoupon.code}</div>
                                                                        <button onClick={() => setAppliedCoupon(null)} className="hover:text-emerald-900"><X size={12} /></button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="bg-gray-50 p-4 rounded-[1.5rem] space-y-2.5">
                                                                {/* Ticket Breakdown */}
                                                                <div className="space-y-1 pb-2 border-b border-gray-200/50">
                                                                    {Object.entries(selectedTickets).map(([id, qty]) => {
                                                                        const ticket = tickets.find(t => t.id === id);
                                                                        if (!ticket || qty === 0) return null;
                                                                        return (
                                                                            <div key={id} className="flex justify-between text-[#1a1a1a]/40 font-montserrat text-[9px] font-bold uppercase tracking-wider">
                                                                                <span>{ticket.description?.name || 'Entry'} ({qty}x)</span>
                                                                                <span>₹{ticket.price * qty}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                <div className="flex justify-between text-[#1a1a1a]/80 font-montserrat text-[10px] font-bold">
                                                                    <span>Subtotal</span>
                                                                    <span>₹{totalBaseAmount}</span>
                                                                </div>

                                                                {bundleInfo.applied.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        {bundleInfo.applied.map((b, i) => (
                                                                            <div key={`registration-bundle-${i}`} className="flex justify-between text-emerald-600 font-montserrat text-[10px] font-medium">
                                                                                <span className="flex items-center gap-1"><Tag size={12} /> {b.name}</span>
                                                                                <span>- ₹{b.savings}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                )}

                                                                {appliedCoupon && (
                                                                    <div className="flex justify-between text-emerald-600 font-montserrat text-[10px]">
                                                                        <span className="flex items-center gap-1"><Tag size={12} /> Coupon</span>
                                                                        <span>- ₹{couponDiscount}</span>
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-between pt-2 border-t border-gray-200 text-[#1a1a1a] font-bold font-montserrat text-sm">
                                                                    <span>Total</span>
                                                                    <span>₹{finalAmount}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="py-8 flex flex-col items-center text-center space-y-4">
                                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"><CheckCircle2 size={40} /></div>
                                            <div className="space-y-1">
                                                <h3 className={`${instrumentSerif.className} text-3xl text-[#1a1a1a]`}>
                                                    {bookingMode === 'waitlist'
                                                        ? 'Waitlist Joined!'
                                                        : paymentUrl
                                                            ? 'Booking Initiated!'
                                                            : 'Registration Confirmed!'}
                                                </h3>
                                                <p className="text-[#1a1a1a]/60 font-montserrat text-xs max-w-xs mx-auto">
                                                    {bookingMode === 'waitlist'
                                                        ? 'You are on the waitlist. We will notify you about the next update.'
                                                        : paymentUrl
                                                            ? 'Complete payment to confirm your seat.'
                                                            : 'Your registration has been successfully submitted.'}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl w-full text-left space-y-0.5">
                                                <p className="text-[8px] font-bold uppercase tracking-widest text-[#1a1a1a]/30">Registration ID</p>
                                                <p className="font-mono text-xs text-[#1a1a1a] break-all">{registrationId}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (paymentUrl) {
                                                        logPaymentFlow('redirecting to payment URL', {
                                                            paymentUrl,
                                                            registrationId,
                                                        });
                                                        window.location.assign(paymentUrl);
                                                        return;
                                                    }
                                                    onClose();
                                                }}
                                                className="w-full py-3 rounded-full bg-[#1a1a1a] text-white font-montserrat font-bold hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 text-sm"
                                            >
                                                {paymentUrl ? 'Pay Now' : 'Done'}
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-[10px] font-montserrat animate-shake">
                                            <AlertCircle size={16} /> {error}
                                        </div>
                                    )}
                                    <div className="h-32" /> {/* Spacer for bottom scroll */}
                                </div>

                                {/* Footer */}
                                {/* Footer */}
                                {!registrationId && (
                                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4 sticky bottom-0 z-10">
                                        {step === 2 && <button onClick={() => setStep(1)} className="px-3 py-2 font-montserrat font-bold text-[#1a1a1a]/40 hover:text-[#1a1a1a] text-[9px] uppercase tracking-widest">Back</button>}
                                        <div className="flex-1" />
                                        <button onClick={step === 1 ? handleNext : handleSubmit} disabled={isLoading || (step === 2 && Object.keys(selectedTickets).length === 0)} className="px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white font-montserrat font-bold hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50 text-xs shadow-lg shadow-black/5">
                                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : (step === 1 ? (eventStatus === 'waitlist' ? 'Join Waitlist' : 'Continue') : (eventStatus === 'waitlist' ? 'Join Waitlist' : 'Book Now'))}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
            <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar { width: 5px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ccc; }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-4px); }
                75% { transform: translateX(4px); }
            }
            .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        `}</style>
        </>
    );
}
