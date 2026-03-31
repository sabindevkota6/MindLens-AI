import { redirect } from "next/navigation";

export default function AdminDashboardRedirectPage() {
  redirect("/dashboard/admin/verification");
}
