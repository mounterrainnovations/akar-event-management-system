import { type LeadUser } from "@/lib/leads/service";

type LeadsSectionManagerProps = {
    users: LeadUser[];
};

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function LeadsSectionManager({ users }: LeadsSectionManagerProps) {
    return (
        <div className="space-y-5">
            {/* Header Row */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Leads</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        All users who have signed into the portal
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-lg font-semibold text-foreground">{users.length}</span>
                    Total Users
                </div>
            </div>

            {/* Table */}
            {users.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 p-8 text-center">
                    <p className="text-sm text-muted-foreground">No users have signed in yet.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">S.No.</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr
                                    key={user.id}
                                    className="border-b last:border-b-0 transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium text-foreground">
                                        {user.fullName || <span className="text-muted-foreground/60 italic">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                                        {user.phone || <span className="text-muted-foreground/40 italic">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{formatDate(user.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
