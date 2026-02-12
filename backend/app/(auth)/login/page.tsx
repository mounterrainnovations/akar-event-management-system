import Image from "next/image";
import Link from "next/link";
import { Eye, Grip } from "lucide-react";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";
import { getAuthSession } from "@/lib/auth/session";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getAuthSession();
  if (session) {
    redirect("/admin");
  }

  const params = await searchParams;
  const error = readParam(params, "error");
  const success = readParam(params, "success");

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
          <p className="text-xs font-medium uppercase tracking-widest opacity-80 lg:text-sm">
            Akar Women Group
          </p>
          <div className="h-px w-12 bg-white/50" />
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="font-serif text-4xl leading-tight lg:text-5xl xl:text-6xl">
            Hotel <br />
            Management <br />
            System
          </h1>
          <p className="mt-4 max-w-sm text-xs leading-relaxed opacity-80 lg:mt-6 lg:text-sm">
            Demonstration Build. Designed for evaluation purposes only. All guest data and financial
            records shown are fictional.
          </p>
        </div>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-8 lg:pt-24 xl:p-12">
        <div className="w-full max-w-sm space-y-6 lg:max-w-md lg:space-y-8">
          <div className="flex justify-center lg:justify-start">
            <div className="flex items-center gap-2 font-medium">
              <Grip className="h-5 w-5 lg:h-6 lg:w-6" />
              <span className="text-sm lg:text-base">Demo Portal - Hotel Booking</span>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="font-serif text-2xl text-gray-900 dark:text-white lg:text-3xl xl:text-4xl">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to access your account
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </p>
          ) : null}

          <form action={loginAction} className="space-y-5 lg:space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 lg:text-sm"
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
                  className="block w-full rounded-lg border-0 bg-gray-50/50 p-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black dark:bg-white/5 dark:text-white dark:focus:ring-white dark:ring-white/10 sm:text-sm sm:leading-6 xl:p-4"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 lg:text-sm"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    className="block w-full rounded-lg border-0 bg-gray-50/50 p-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black dark:bg-white/5 dark:text-white dark:focus:ring-white dark:ring-white/10 sm:text-sm sm:leading-6 xl:p-4"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Eye className="h-4 w-4 text-gray-400 lg:h-5 lg:w-5" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-black px-3 py-3 text-xs font-semibold leading-6 text-white shadow-sm hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2 dark:bg-white dark:text-black dark:hover:bg-gray-200 lg:text-sm xl:py-4"
            >
              Sign In
            </button>

            <div className="text-center text-sm font-medium text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-black hover:underline dark:text-white">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
