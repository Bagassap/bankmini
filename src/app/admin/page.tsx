import { redirect } from "next/navigation";

/** /admin cuma jadi pintu masuk — landing sebenarnya untuk role Admin/Superadmin
 * adalah /admin/dashboard. */
export default function AdminPage() {
  redirect("/admin/dashboard");
}
