import { AppNavbar } from "@/components/shared/navbar";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = (session?.user?.role as string) || "PATIENT";

  return (
    <>
      <AppNavbar role={role} />
      {children}
    </>
  );
}
