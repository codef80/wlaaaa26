"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import type { Cafe, Customer } from "@/lib/types";

type Props = {
  cafe: Cafe;
  staffId: string;
};

export default function CashierScreen({ cafe, staffId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [searched, setSearched] = useState(false);
  const [cups, setCups] = useState(1);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const target = cafe.loyalty_settings.cups_for_free;

  function normalizePhone(raw: string): string {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = "966" + p.slice(1);
    if (!p.startsWith("966") && p.length === 9) p = "966" + p;
    return p;
  }

  async function lookup() {
    const p = normalizePhone(phone);
    if (p.length < 12) {
      setStatus("رقم الجوال غير مكتمل");
      return;
    }
    setBusy(true);
    setStatus(null);
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("cafe_id", cafe.id)
      .eq("phone", p)
      .maybeSingle();
    setBusy(false);
    setSearched(true);
    setCustomer(data as Customer | null);
  }

  function sendWhatsApp() {
    const p = normalizePhone(phone);
    const name = customer?.name || "عميلنا العزيز";
    const msg = `أهلاً ${name} 👋\nمرحباً بك في ${cafe.name}.\nاضغط الرابط لتأكيد رقمك وعرض بطاقة الولاء الخاصة بك.`;
    const url = `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  async function approve() {
    const p = normalizePhone(phone);
    setBusy(true);
    setStatus(null);

    let cust = customer;

    // إنشاء العميل إن لم يكن موجوداً
    if (!cust) {
      const { data, error } = await supabase
        .from("customers")
        .insert({ cafe_id: cafe.id, phone: p, cups_balance: 0 })
        .select()
        .single();
      if (error) {
        setBusy(false);
        setStatus("تعذّر إنشاء العميل");
        return;
      }
      cust = data as Customer;
    }

    // تسجيل الزيارة
    const { error: vErr } = await supabase.from("visits").insert({
      cafe_id: cafe.id,
      customer_id: cust.id,
      cups,
      note: note || null,
      staff_id: staffId,
    });
    if (vErr) {
      setBusy(false);
      setStatus("تعذّر تسجيل الزيارة");
      return;
    }

    // تحديث رصيد الأكواب
    const newBalance = cust.cups_balance + cups;
    await supabase
      .from("customers")
      .update({ cups_balance: newBalance })
      .eq("id", cust.id);

    setBusy(false);
    setCustomer({ ...cust, cups_balance: newBalance });
    const eligible = newBalance >= target;
    setStatus(
      `تم إضافة ${cups} ${cups === 1 ? "كوب" : "أكواب"} — الرصيد: ${newBalance} من ${target}` +
        (eligible ? " • العميل مؤهل للروليت 🎉" : "")
    );
    setNote("");
    setCups(1);
  }

  function reset() {
    setPhone("");
    setCustomer(null);
    setSearched(false);
    setCups(1);
    setNote("");
    setStatus(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/staff/login");
    router.refresh();
  }

  return (
    <main className="cashier-wrap">
      <header className="cashier-head">
        <div>
          <h1 className="cashier-cafe">{cafe.name}</h1>
          <p className="cashier-role">شاشة الكاشير</p>
        </div>
        <button className="btn-ghost" onClick={logout}>
          خروج
        </button>
      </header>

      <div className="cashier-card">
        <label className="field-label" htmlFor="phone">
          رقم جوال العميل
        </label>
        <div className="phone-row">
          <input
            id="phone"
            type="tel"
            className="field"
            dir="ltr"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="05xxxxxxxx"
          />
          <button className="btn-secondary" onClick={lookup} disabled={busy}>
            بحث
          </button>
        </div>

        {searched && (
          <div className="lookup-result">
            {customer ? (
              <div className="cust-found">
                <span className="cust-name">
                  {customer.name || "عميل بدون اسم"}
                </span>
                <span className="cust-balance num">
                  {customer.cups_balance} / {target} أكواب
                </span>
              </div>
            ) : (
              <p className="cust-new">عميل جديد — سيُنشأ عند الاعتماد</p>
            )}
          </div>
        )}

        {phone && (
          <button className="btn-wa" onClick={sendWhatsApp}>
            <span>إرسال تحقق واتساب</span>
          </button>
        )}

        <div className="cups-section">
          <label className="field-label">عدد الأكواب</label>
          <div className="cups-stepper">
            <button
              className="step-btn"
              onClick={() => setCups((c) => Math.max(1, c - 1))}
            >
              −
            </button>
            <span className="cups-value num">{cups}</span>
            <button className="step-btn" onClick={() => setCups((c) => c + 1)}>
              +
            </button>
          </div>
        </div>

        <label className="field-label" htmlFor="note">
          ملاحظة (اختياري)
        </label>
        <input
          id="note"
          type="text"
          className="field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="مثال: طلب خاص"
        />

        <button className="btn-primary big" onClick={approve} disabled={busy}>
          {busy ? "جارٍ الاعتماد…" : "اعتماد العملية"}
        </button>

        {status && <div className="status-box">{status}</div>}

        {status && (
          <button className="btn-ghost full" onClick={reset}>
            عملية جديدة
          </button>
        )}
      </div>
    </main>
  );
}
