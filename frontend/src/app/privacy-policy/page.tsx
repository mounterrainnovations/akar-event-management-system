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

export default function PrivacyPolicyPage() {
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
                                {['Privacy', 'Policy'].map((word, i) => (
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

                    {/* Introduction */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>Introduction</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                This Privacy Policy describes how Akar Women Group and its affiliates (collectively &quot;Akar Women Group&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) collect, use, share, protect or otherwise process your information/personal data through our website and platform (hereinafter referred to as the &quot;Platform&quot;).
                            </p>
                            <p>
                                Please note that you may be able to browse certain sections of the Platform without registering with us. We do not offer any product or service under this Platform outside India and your personal data will primarily be stored and processed in India. By visiting this Platform, providing your information or availing any product or service offered on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy Policy, the Terms of Use and the applicable service/product terms and conditions, and agree to be governed by the laws of India including but not limited to the laws applicable to data protection and privacy. If you do not agree, please do not use or access our Platform.
                            </p>
                        </div>
                    </section>

                    {/* Collection */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>Collection</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                We collect your personal data when you use our Platform, services or otherwise interact with us during the course of our relationship and related information provided from time to time. Some of the information that we may collect includes but is not limited to personal data or information provided to us during sign-up/registering or using our Platform such as name, date of birth, address, telephone/mobile number, email ID and/or any such information shared as proof of identity or address.
                            </p>
                            <p>
                                Some of the sensitive personal data may be collected with your consent, such as your bank account or credit/debit card or other payment instrument information or biometric information such as your facial features or physiological information (in order to enable use of certain features when opted for, available on the Platform), all in accordance with applicable laws. You always have the option to not provide information by choosing not to use a particular service or feature on the Platform.
                            </p>
                            <p>
                                We may track your behaviour, preferences, and other information that you choose to provide on our Platform. This information is compiled and analysed on an aggregated basis. We will also collect your information related to your transactions on the Platform and such third-party business partner platforms. When such a third-party business partner collects your personal data directly from you, you will be governed by their privacy policies. We shall not be responsible for the third-party business partner&apos;s privacy practices or the content of their privacy policies, and we request you to read their privacy policies prior to disclosing any information.
                            </p>
                            <p>
                                If you receive an email or a call from a person/association claiming to be Akar Women Group seeking any personal data like debit/credit card PIN, net-banking or mobile banking password, please never provide such information. If you have already revealed such information, report it immediately to an appropriate law enforcement agency.
                            </p>
                        </div>
                    </section>

                    {/* Usage */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>Usage</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                We use personal data to provide the services you request. To the extent we use your personal data to market to you, we will provide you the ability to opt-out of such uses. We use your personal data to assist sellers and business partners in handling and fulfilling orders; enhancing customer experience; to resolve disputes; troubleshoot problems; inform you about online and offline offers, products, services, and updates; customise your experience; detect and protect us against error, fraud and other criminal activity; enforce our terms and conditions; conduct marketing research, analysis and surveys; and as otherwise described to you at the time of collection of information. You understand that your access to these products/services may be affected in the event permission is not provided to us.
                            </p>
                        </div>
                    </section>

                    {/* Sharing */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>Sharing</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                We may share your personal data internally within our group entities, our other corporate entities, and affiliates to provide you access to the services and products offered by them. These entities and affiliates may market to you as a result of such sharing unless you explicitly opt-out.
                            </p>
                            <p>
                                We may disclose personal data to third parties such as sellers, business partners, third party service providers including logistics partners, prepaid payment instrument issuers, third-party reward programs and other payment options opted by you. These disclosures may be required for us to provide you access to our services and products offered to you, to comply with legal obligations, to enforce our user agreement, to facilitate marketing and advertising activities, and to prevent, detect, mitigate, and investigate fraudulent or illegal activities related to our services.
                            </p>
                            <p>
                                We may disclose personal and sensitive personal data to government agencies or other authorised law enforcement agencies if required to do so by law or in the good faith belief that such disclosure is reasonably necessary to respond to subpoenas, court orders, or other legal process. We may disclose personal data to law enforcement offices, third party rights owners, or others in the good faith belief that such disclosure is reasonably necessary to enforce our Terms of Use or Privacy Policy; respond to claims that an advertisement, posting or other content violates the rights of a third party; or protect the rights, property or personal safety of our users or the general public.
                            </p>
                        </div>
                    </section>

                    {/* Security Precautions */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>Security Precautions</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                To protect your personal data from unauthorised access or disclosure, loss or misuse, we adopt reasonable security practices and procedures. Once your information is in our possession or whenever you access your account information, we adhere to security guidelines to protect it against unauthorised access and offer the use of a secure server.
                            </p>
                            <p>
                                However, transmission of information is not completely secure for reasons beyond our control. By using the Platform, users accept the security implications of data transmission over the internet and the World Wide Web which cannot always be guaranteed as completely secure, and therefore, there would always remain certain inherent risks regarding use of the Platform. Users are responsible for ensuring the protection of login and password records for their account.
                            </p>
                        </div>
                    </section>

                    {/* Data Deletion and Retention */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>Data Deletion and Retention</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                You have an option to request deletion of your account and associated information by contacting us through our official support channels. This action may result in you losing all information related to your account. We may, in the event of pending grievance, claims, ongoing event participation, pending transactions or any other service requirement, refuse or delay deletion of the account.
                            </p>
                            <p>
                                Once the account is deleted, you may lose access to the account and related services. We retain your personal data for a period no longer than required for the purpose for which it was collected or as required under applicable law. However, we may retain data related to you if we believe it may be necessary to prevent fraud or future abuse or for other legitimate purposes. We may continue to retain your data in anonymised form for analytical and research purposes.
                            </p>
                        </div>
                    </section>

                    {/* Your Rights */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>Your Rights</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                You may access, rectify, and update your personal data directly through functionalities made available on the Platform, or by contacting us through our official support channels where such direct functionality is unavailable.
                            </p>
                        </div>
                    </section>

                    {/* Consent */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>Consent</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                By visiting our Platform or by providing your information, you consent to the collection, use, storage, disclosure and otherwise processing of your information on the Platform in accordance with this Privacy Policy. If you disclose to us any personal data relating to other people, you represent that you have the authority to do so and permit us to use the information in accordance with this Privacy Policy.
                            </p>
                            <p>
                                You, while providing your personal data over the Platform or any partner platforms or establishments, consent to us (including our corporate entities, affiliates, technology partners, marketing channels, business partners and other third parties) to contact you through SMS, instant messaging apps, call and/or email for the purposes specified in this Privacy Policy.
                            </p>
                            <p>
                                You have an option to withdraw your consent already provided by writing to us through our official support email. Please mention &quot;Withdrawal of consent for processing personal data&quot; in your subject line. We may verify such requests before acting on them. Please note that withdrawal of consent will not be retrospective and will be in accordance with the Terms of Use, this Privacy Policy, and applicable laws. In the event you withdraw consent given under this Privacy Policy, we reserve the right to restrict or deny provision of services for which we consider such information to be necessary.
                            </p>
                        </div>
                    </section>

                    {/* Changes to this Privacy Policy */}
                    <section className="space-y-4">
                        <h2 className={`${instrumentSerif.className} text-3xl md:text-4xl mb-6`}>Changes to this Privacy Policy</h2>
                        <div className="space-y-4 text-lg font-light leading-relaxed text-[#1a1a1a]/80">
                            <p>
                                Please check our Privacy Policy periodically for changes. We may update this Privacy Policy to reflect changes to our information practices. We may alert or notify you about significant changes to the Privacy Policy in the manner as may be required under applicable laws.
                            </p>
                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
}
