import Image from "next/image";
import Link from "next/link";
import { Eye, Grip } from "lucide-react";
import { redirect } from "next/navigation";
import { signupAction } from "@/app/(auth)/actions";
import { getAuthSession } from "@/lib/auth/session";
import { QueryToasts } from "@/components/providers/QueryToasts";

export default async function SignupPage() {
  const session = await getAuthSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-white dark:bg-black lg:flex-row">
      <div className="relative h-32 w-full shrink-0 lg:hidden">
        <Image src="/authbg.jpg" alt="Abstract Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute inset-0 z-0">
          <Image src="/authbg.jpg" alt="Abstract Background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <p className="text-sm font-medium uppercase tracking-widest opacity-80">
            Akar Women Group
          </p>
          <div className="h-px w-12 bg-white/50" />
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="font-serif text-6xl leading-tight">
            Hotel <br />
            Management <br />
            System
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed opacity-80">
            Demonstration Build. Designed for evaluation purposes only. All guest data and financial
            records shown are fictional.
          </p>
        </div>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <QueryToasts scope="signup" keys={["error", "success"]} />
          <div className="flex justify-center lg:justify-start">
            <div className="flex items-center gap-2 font-medium">
              <Grip className="h-6 w-6" />
              <span>Demo Portal - Hotel Booking</span>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="font-serif text-4xl text-gray-900 dark:text-white">Create Account</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Enter your details to create your account
            </p>
          </div>

          <form action={signupAction} className="space-y-6">
            <div className="space-y-4">
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
                  className="block w-full rounded-lg border-0 bg-gray-50/50 p-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black dark:bg-white/5 dark:text-white dark:focus:ring-white dark:ring-white/10 sm:text-sm sm:leading-6"
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
                    minLength={8}
                    required
                    placeholder="Create a password (min 8 chars)"
                    className="block w-full rounded-lg border-0 bg-gray-50/50 p-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black dark:bg-white/5 dark:text-white dark:focus:ring-white dark:ring-white/10 sm:text-sm sm:leading-6"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-black px-3 py-4 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Sign Up
            </button>

            <div className="text-center text-sm font-medium text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-black hover:underline dark:text-white">
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
