import { redirect } from "next/navigation";

export default function AdminUsersRoot() {
  redirect("/dashboard/admin/users/counselors");
}
