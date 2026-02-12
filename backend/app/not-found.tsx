import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-10 text-center shadow-sm">
        <h1 className="text-5xl leading-none">404</h1>
        <h2 className="mt-4 text-2xl">Page Not Found</h2>
        <p className="mt-3 text-black/70">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-md border border-black/20 px-4 py-2 text-sm hover:bg-black/5"
        >
          Go to Home
        </Link>
      </section>
    </main>
  );
}
