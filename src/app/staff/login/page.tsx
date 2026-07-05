"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function StaffLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError("تعذّر تسجيل الدخول. تأكد من الإيميل وكلمة المرور.");
      return;
    }
    router.push("/staff");
    router.refresh();
  }

  return (
    <main className="login-wrap">
      <div className="login-card">
        <h1 className="login-title">تسجيل الدخول</h1>
        <p className="login-sub">لوحة الموظف</p>

        <label className="field-label" htmlFor="email">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          className="field"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@najma.test"
        />

        <label className="field-label" htmlFor="password">
          كلمة المرور
        </label>
        <input
          id="password"
          type="password"
          className="field"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        {error && <p className="login-error">{error}</p>}

        <button
          className="btn-primary"
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? "جارٍ الدخول…" : "دخول"}
        </button>
      </div>
    </main>
  );
}
