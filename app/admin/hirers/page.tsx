import { redirect } from "next/navigation";

export default function AdminHirersPage() {
  redirect("/admin/users?role=Hire");
}
