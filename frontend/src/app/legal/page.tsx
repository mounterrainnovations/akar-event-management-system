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

export default function LegalPage() {
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
                                {['Legal', 'Notice'].map((word, i) => (
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

                    {/* 1. Website and Platform Information */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>1. Website and Platform Information</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                This Legal Notice governs your access to and use of the Akar Women Group website and related platform services (collectively, the &quot;Platform&quot;).
                            </p>
                        </div>
                    </section>

                    {/* 2. Intellectual Property Rights */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>2. Intellectual Property Rights</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                All content on this website, including but not limited to text, graphics, logos, images, photographs, audio clips, digital downloads, data compilations, and software, is the property of Akar Women Group or its content suppliers and is protected by Indian and international copyright laws.
                            </p>
                            <h3 className="text-xl font-medium mt-6 mb-2 text-[#1a1a1a]">2.1 Trademarks</h3>
                            <p>
                                Akar Women Group, our logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Akar Women Group or its affiliates or licensors.
                            </p>
                            <h3 className="text-xl font-medium mt-6 mb-2 text-[#1a1a1a]">2.2 Copyright Notice</h3>
                            <p>
                                © 2026 Akar Women Group. All rights reserved. No part of this website may be reproduced, distributed, or transmitted in any form or by any means without our prior written permission.
                            </p>
                        </div>
                    </section>

                    {/* 3. Disclaimer */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>3. Disclaimer</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                The information on this website is provided on an &quot;as is&quot; basis. To the fullest extent permitted by law, Akar Women Group excludes all representations, warranties, conditions, and other terms which might otherwise be implied by statute, common law, or the law of equity.
                            </p>
                            <h3 className="text-xl font-medium mt-6 mb-2 text-[#1a1a1a]">3.1 Content Accuracy</h3>
                            <p>
                                While we strive to ensure the accuracy of information on our website, we make no warranties about the completeness, reliability, and accuracy of this information.
                            </p>
                            <h3 className="text-xl font-medium mt-6 mb-2 text-[#1a1a1a]">3.2 External Links</h3>
                            <p>
                                Our website may contain links to external websites. We have no control over the content and nature of these sites and are not responsible for their content or privacy practices.
                            </p>
                        </div>
                    </section>

                    {/* 4. Limitation of Liability */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>4. Limitation of Liability</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Akar Women Group shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of our services or website, even if we have been advised of the possibility of such damages.
                            </p>
                        </div>
                    </section>

                    {/* 5. Governing Law and Jurisdiction */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>5. Governing Law and Jurisdiction</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                This Legal Notice and any disputes arising out of or in connection with it shall be governed by and construed in accordance with the laws of India.
                            </p>
                            <p>
                                Any legal action or proceeding arising under this Legal Notice will be brought exclusively in the courts located in Mumbai, Maharashtra, and the parties hereby consent to personal jurisdiction and venue therein.
                            </p>
                        </div>
                    </section>

                    {/* 6. Regulatory Compliance */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>6. Regulatory Compliance</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <h3 className="text-xl font-medium mt-6 mb-2 text-[#1a1a1a]">6.1 Consumer Protection</h3>
                            <p>
                                We are committed to protecting consumer rights and operate in accordance with applicable consumer protection laws in India.
                            </p>
                            <h3 className="text-xl font-medium mt-6 mb-2 text-[#1a1a1a]">6.2 Data Protection</h3>
                            <p>
                                We comply with applicable data protection and privacy laws, including the Information Technology Act, 2000 and related rules for the protection of personal data.
                            </p>
                        </div>
                    </section>

                    {/* 7. Indemnification */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>7. Indemnification</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                You agree to indemnify, defend, and hold harmless Akar Women Group, its officers, directors, employees, agents, and third parties, for any losses, costs, liabilities, and expenses relating to or arising out of your use of or inability to use the website or services, your violation of any terms, or your violation of any rights of a third party.
                            </p>
                        </div>
                    </section>

                    {/* 8. Severability */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>8. Severability</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                If any provision of this Legal Notice is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that this Legal Notice will otherwise remain in full force and effect and enforceable.
                            </p>
                        </div>
                    </section>

                    {/* 9. Modifications */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>9. Modifications</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Akar Women Group reserves the right to modify this Legal Notice at any time. Any changes will be effective immediately upon posting on our website. Your continued use of the website after any such changes constitutes your acceptance of the new Legal Notice.
                            </p>
                        </div>
                    </section>

                    {/* 10. Legal Inquiries */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>10. Legal Inquiries</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                For any legal inquiries, notices, or concerns regarding this Legal Notice, please contact us:
                            </p>
                            <p className="font-medium">
                                Legal Department: <a href="mailto:hello@akarwomen.com" className="hover:underline">hello@akarwomen.com</a>
                            </p>
                            <p className="border-t border-black/10 pt-4 mt-6">
                                This Legal Notice is effective as of the date last updated above and governs your use of Akar Women Group&apos;s website and services. Please review this notice periodically for any changes.
                            </p>
                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
}
