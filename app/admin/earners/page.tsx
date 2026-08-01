import { redirect } from "next/navigation";

export default function AdminEarnersPage() {
  redirect("/admin/users?role=Earn");
}
