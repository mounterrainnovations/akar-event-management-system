"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Grip } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

function SignupContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Check if the system query param is set to 'restaurant'
    const isRestaurant = searchParams.get('system') === 'restaurant';

    const toggleSystem = () => {
        if (isRestaurant) {
            router.push('/signup');
        } else {
            router.push('/signup?system=restaurant');
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col lg:flex-row overflow-hidden bg-white dark:bg-black">
            {/* Mobile Header Image */}
            <div className="relative h-32 w-full shrink-0 lg:hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isRestaurant ? "restaurant-img-mobile" : "hotel-img-mobile"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={isRestaurant ? "/authbg-rest.jpg" : "/authbg.jpg"}
                            alt="Abstract Background"
                            fill
                            className="object-cover"
                            priority
                        />
                    </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Left Side - Hero Image (Desktop) */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
                {/* Abstract Background Image */}
                <div className="absolute inset-0 z-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isRestaurant ? "restaurant-img-desktop" : "hotel-img-desktop"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={isRestaurant ? "/authbg-rest.jpg" : "/authbg.jpg"}
                                alt="Abstract Background"
                                fill
                                className="object-cover"
                                priority
                            />
                        </motion.div>
                    </AnimatePresence>
                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                </div>

                {/* Top Text */}
                <div className="relative z-10 flex items-center gap-4">
                    <p className="text-sm font-medium tracking-widest uppercase opacity-80">
                        Mounterra Innovations
                    </p>
                    <div className="h-px] w-12 bg-white/50" />
                </div>

                {/* Bottom Text */}
                <div className="relative z-10 max-w-lg">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isRestaurant ? "restaurant-text" : "hotel-text"}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 className="font-serif text-6xl leading-tight">
                                {isRestaurant ? (
                                    <>
                                        Restaurant <br />
                                        Management <br />
                                        System
                                    </>
                                ) : (
                                    <>
                                        Hotel <br />
                                        Management <br />
                                        System
                                    </>
                                )}
                            </h1>
                        </motion.div>
                    </AnimatePresence>
                    <p className="mt-6 text-sm opacity-80 leading-relaxed max-w-sm">
                        Demonstration Build. Designed for evaluation purposes only. All guest data and financial records shown are fictional.
                    </p>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="relative flex w-full flex-col items-center justify-center p-8 lg:w-1/2">


                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <div className="flex justify-center lg:justify-start">
                        <div className="flex items-center gap-2 font-medium">
                            <Grip className="h-6 w-6" />
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={isRestaurant ? "restaurant-header" : "hotel-header"}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {isRestaurant
                                        ? "Demo Portal - Restaurant Management"
                                        : "Demo Portal - Hotel Booking"}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="font-serif text-4xl text-gray-900 dark:text-white">
                            Create Account
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Enter your details to create your account
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    placeholder="Enter your full name"
                                    className="block w-full rounded-lg border-0 bg-gray-50/50 p-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 dark:bg-white/5 dark:ring-white/10 dark:text-white dark:focus:ring-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="Enter your email"
                                    className="block w-full rounded-lg border-0 bg-gray-50/50 p-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 dark:bg-white/5 dark:ring-white/10 dark:text-white dark:focus:ring-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        placeholder="Create a password"
                                        className="block w-full rounded-lg border-0 bg-gray-50/50 p-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 dark:bg-white/5 dark:ring-white/10 dark:text-white dark:focus:ring-white"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/dashboard"
                                className="flex w-full justify-center rounded-lg bg-black px-3 py-4 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white dark:text-black dark:hover:bg-gray-200"
                            >
                                Sign Up
                            </Link>

                            <button
                                type="button"
                                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-200 dark:bg-black dark:border-gray-800 dark:text-white dark:hover:bg-gray-900"
                            >
                                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                    <path
                                        d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-4.6667-3.7833-8.45-8.45-8.45-4.6667 0-8.45 3.7833-8.45 8.45 0 4.6667 3.7833 8.45 8.45 8.45Z"
                                        fill="#fff"
                                        fillOpacity="0"
                                        stroke="none"
                                    />
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M23.52 12.2727C23.52 11.4242 23.4436 10.6061 23.3018 9.81818H12V14.4606H18.4582C18.18 15.9636 17.3345 17.2364 16.0636 18.0848V21.097H19.9418C22.2109 19.0061 23.52 15.9273 23.52 12.2727Z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M12 24C15.24 24 17.9564 22.9273 19.9418 21.097L16.0636 18.0848C14.9891 18.8061 13.6145 19.2303 12 19.2303C8.87455 19.2303 6.22909 17.1152 5.28545 14.2848H1.27637V17.3939C3.25091 21.3152 7.33091 24 12 24Z"
                                        fill="#34A853"
                                    />
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M5.28545 14.2848C5.04545 13.5636 4.90909 12.7939 4.90909 12C4.90909 11.2061 5.04545 10.4364 5.28545 9.71515V6.60606H1.27637C0.463636 8.22424 0 10.0545 0 12C0 13.9455 0.463636 15.7758 1.27637 17.3939L5.28545 14.2848Z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M12 4.7697C13.7618 4.7697 15.3436 5.37576 16.5873 6.56364L20.0236 3.12727C17.9509 1.19394 15.2345 0 12 0C7.33091 0 3.25091 2.68485 1.27637 6.60606L5.28545 9.71515C6.22909 6.88485 8.87455 4.7697 12 4.7697Z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Sign Up with Google
                            </button>
                        </div>

                        <div className="text-center text-sm font-medium text-gray-500">
                            Already have an account?{' '}
                            <Link href={isRestaurant ? "/login?system=restaurant" : "/login"} className="font-semibold text-black hover:underline dark:text-white">Sign In</Link>
                        </div>
                    </form>
                </div>

                {/* Switch System Button */}
                <div className="mt-8 w-full flex justify-center lg:absolute lg:top-8 lg:right-8 lg:mt-0 lg:w-auto lg:justify-end">
                    <button
                        onClick={toggleSystem}
                        className="text-[10px] lg:text-xs font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors text-center lg:text-right leading-tight whitespace-nowrap"
                    >
                        {isRestaurant
                            ? <>Switch to Hotel <br className="lg:hidden" /> Operations System &rarr;</>
                            : <>Switch to Restaurant <br className="lg:hidden" /> Management System &rarr;</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupContent />
        </Suspense>
    );
}