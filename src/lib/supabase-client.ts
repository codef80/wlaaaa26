import { createBrowserClient } from "@supabase/ssr";

/**
 * عميل Supabase للاستخدام في المتصفح (Client Components).
 * يستخدم المفاتيح العامة فقط (NEXT_PUBLIC_) — آمنة للظهور، محمية بـ RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
