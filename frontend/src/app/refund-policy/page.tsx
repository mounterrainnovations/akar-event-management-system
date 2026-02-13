'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { instrumentSerif } from '@/lib/fonts';

const wordAnim = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
    },
};

const container = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

export default function RefundPolicyPage() {
    return (
        <main className="min-h-screen relative overflow-hidden bg-white">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40"
                style={{ backgroundImage: 'url("/event_bg.png")' }}
            />

            <div className="relative z-10 pt-[120px] pb-24 px-4 md:px-12 lg:px-16">
                {/* Hero Section */}
                <section className="mb-20">
                    <div className="max-w-4xl">
                        <motion.h1
                            className={`${instrumentSerif.className} text-[#1a1a1a] text-[12vw] md:text-[7.5vw] lg:text-[7vw] xl:text-[5.5vw] leading-[1] md:leading-[0.95] tracking-[-0.02em]`}
                            variants={container}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <div className="block">
                                {['Refund', 'and', 'Cancellation', 'Policy'].map((word, i) => (
                                    <motion.span
                                        key={`title-${i}`}
                                        variants={wordAnim}
                                        className="inline-block mr-[0.3em]"
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.h1>
                        <p className="mt-8 text-[#1a1a1a]/60 text-lg md:text-xl max-w-2xl font-light">
                            Last Updated: February 12, 2026
                        </p>
                    </div>
                </section>

                {/* Content Section */}
                <div className="max-w-4xl mx-auto md:mx-0 space-y-12 text-[#1a1a1a]">

                    {/* Intro */}
                    <section className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                        <p>
                            This Refund and Cancellation Policy governs all purchases, registrations, and payments made on the Akar Women Group Platform, including but not limited to event tickets, workshops, masterclasses, memberships, consultations, digital programs, and allied services.
                        </p>
                        <p>
                            By proceeding with any payment on the Platform, you expressly acknowledge that you have read, understood, and agreed to this policy in full. This policy becomes binding immediately upon successful payment confirmation.
                        </p>
                    </section>

                    {/* 1. Strict No Refund Policy */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>1. Strict No Refund Policy</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Akar Women Group follows a strict and non-negotiable No Refund Policy. All payments made on the Platform are final and non-refundable, whether paid in full, in part, through installment arrangements, under promotional pricing, or as part of bundled access.
                            </p>
                            <p>
                                Refunds will not be issued for reasons including, without limitation, change of mind, inability to attend, scheduling conflicts, delayed participation, partial usage, dissatisfaction based on personal preference, technical limitations on the user side, or any other personal circumstance.
                            </p>
                        </div>
                    </section>

                    {/* 2. Strict No Cancellation Policy */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>2. Strict No Cancellation Policy</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Akar Women Group follows a strict and non-negotiable No Cancellation Policy. Once a booking, registration, or purchase is completed, it cannot be cancelled by the user for reversal of payment liability.
                            </p>
                            <p>
                                The Platform does not provide a self-cancellation feature. Any request submitted through unofficial channels will not be treated as a valid cancellation request.
                            </p>
                        </div>
                    </section>

                    {/* 3. Contact Owner Only */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>3. Contact Owner Only</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                For any request related to payment clarification, billing concerns, or exceptional case review, users must contact the owner only through official owner contact channels published on the Platform.
                            </p>
                            <p>
                                Contacting the owner does not constitute a refund or cancellation approval. Any response or review is provided solely for support, clarification, or case assessment and does not waive this policy.
                            </p>
                        </div>
                    </section>

                    {/* 4. Nature of Services and Operational Commitment */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>4. Nature of Services and Operational Commitment</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Services offered by Akar Women Group are time-sensitive and capacity-linked. Operational planning, resource allocation, scheduling, and administrative commitments begin once payment is confirmed. Therefore, refunds and cancellations are not feasible after purchase.
                            </p>
                        </div>
                    </section>

                    {/* 5. Promotional Offers and Discounted Purchases */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>5. Promotional Offers and Discounted Purchases</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Any promotional offer, coupon, scholarship, early-bird fee, or discounted plan remains subject to this same No Refund and No Cancellation Policy. No separate refund/cancellation rights arise from discounted or bundled transactions.
                            </p>
                        </div>
                    </section>

                    {/* 6. Chargebacks and Payment Disputes */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>6. Chargebacks and Payment Disputes</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Users are strongly advised to contact the owner first for resolution before raising a payment dispute or chargeback. Unauthorized or bad-faith chargeback actions may result in temporary or permanent restriction from ongoing and future services, subject to applicable law and gateway rules.
                            </p>
                        </div>
                    </section>

                    {/* 7. Event/Service Changes */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>7. Event/Service Changes</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Akar Women Group reserves the right to modify dates, time slots, delivery formats, speakers, or program structures due to operational, legal, safety, partner, or force majeure reasons. Such changes shall not by themselves create any right to refund or cancellation.
                            </p>
                        </div>
                    </section>

                    {/* 8. Statutory Exception */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>8. Statutory Exception</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                If any refund is mandatorily required under applicable non-waivable law for a specific transaction, such request will be reviewed and processed strictly in accordance with legal requirements and after due verification.
                            </p>
                        </div>
                    </section>

                    {/* 9. Policy Acceptance */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>9. Policy Acceptance</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                By making a payment on the Platform, you confirm your irrevocable acceptance of this policy, including No Refund, No Cancellation, and contact owner only for related support requirements.
                            </p>
                        </div>
                    </section>

                    {/* 10. Policy Updates */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>10. Policy Updates</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Akar Women Group may revise this policy from time to time for legal, compliance, or operational reasons. Revised versions will be posted on the Platform with an updated effective date.
                            </p>
                        </div>
                    </section>

                    {/* Summary */}
                    <section className="mt-12 p-8 bg-[#f5f5f5] rounded-lg border border-[#1a1a1a]/10">
                        <h2 className={`${instrumentSerif.className} text-2xl md:text-3xl mb-6`}>Summary</h2>
                        <ul className="space-y-3 text-lg font-light text-[#1a1a1a]/80">
                            <li className="flex items-start gap-3">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#1a1a1a] flex-shrink-0" />
                                No Refund for any purchase/service.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#1a1a1a] flex-shrink-0" />
                                No Cancellation through the Platform.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#1a1a1a] flex-shrink-0" />
                                For any such requirements, contact owner only.
                            </li>
                        </ul>
                    </section>

                </div>
            </div>
        </main>
    );
}
