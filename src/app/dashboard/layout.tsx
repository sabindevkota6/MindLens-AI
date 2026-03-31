import { AppNavbar } from "@/components/shared/navbar";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { DashboardFooter } from "@/components/shared/dashboard-footer";
import { ChatWidget } from "@/components/shared/chat-widget";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = (session?.user?.role as string) || "PATIENT";
  const isAdmin = role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      {isAdmin ? <AdminNavbar /> : <AppNavbar role={role} />}
      <main className="flex w-full flex-1 flex-col">{children}</main>
      <DashboardFooter role={role} />
      <ChatWidget role={role} />
    </div>
  );
}
