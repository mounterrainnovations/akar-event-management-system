import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { logoutAction } from "@/app/(auth)/actions";
import { QueryToasts } from "@/components/providers/QueryToasts";

export default async function AdminPage() {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-20">
      <QueryToasts scope="admin" keys={["success", "info", "error"]} />
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
      <p className="mt-4 text-gray-600">
        Logged in as <span className="font-medium text-gray-900">{session.email}</span>
      </p>
      <p className="mt-1 text-gray-600">
        Role: <span className="font-medium text-gray-900">{session.role}</span>
      </p>
      <form action={logoutAction} className="mt-8">
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
