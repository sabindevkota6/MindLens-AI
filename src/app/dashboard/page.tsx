import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // redirect to correct dashboard
  const role = session.user.role;

  if (role === "COUNSELOR") {
    redirect("/dashboard/counselor");
  } else if (role === "ADMIN") {
    redirect("/dashboard/admin");
  } else {
    redirect("/dashboard/patient");
  }
}
