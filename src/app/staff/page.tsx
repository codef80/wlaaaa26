import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CashierScreen from "./CashierScreen";
import type { Cafe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/staff/login");
  }

  // إيجاد الكافيه الذي ينتمي له هذا الموظف
  const { data: staffRow } = await supabase
    .from("staff")
    .select("id, cafe_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!staffRow) {
    return (
      <main className="cashier-wrap">
        <div className="cashier-card">
          <h1 className="cashier-cafe">لا يوجد كافيه مرتبط</h1>
          <p className="cust-new">
            حسابك غير مرتبط بأي كافيه. تواصل مع مالك الكافيه.
          </p>
        </div>
      </main>
    );
  }

  const { data: cafe } = await supabase
    .from("cafes")
    .select("*")
    .eq("id", staffRow.cafe_id)
    .single();

  return <CashierScreen cafe={cafe as Cafe} staffId={staffRow.id} />;
}
