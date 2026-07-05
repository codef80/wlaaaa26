/**
 * التعرّف على الكافيه (المستأجر / tenant) من الرابط.
 *
 * يدعم طريقتين معاً — عشان ننتقل من التطوير للإطلاق بسلاسة:
 *
 *  1) دومين فرعي (الإطلاق):   cafe-name.yourbrand.com  →  "cafe-name"
 *  2) مسار مؤقت (التطوير):    yourapp.vercel.app/c/cafe-name  →  "cafe-name"
 *
 * عند شراء الدومين وتفعيل wildcard subdomain، ما نغيّر شي بالمنطق —
 * الطريقة الأولى تشتغل تلقائياً.
 */

// دومينات نتجاهلها (لا تُعتبر اسم كافيه)
const ROOT_HOSTS = ["localhost", "vercel.app", "yourbrand.com", "www"];

/** استخراج slug الكافيه من اسم المضيف (host) */
export function getCafeSlugFromHost(host: string | null): string | null {
  if (!host) return null;

  // نشيل رقم المنفذ لو موجود (localhost:3000)
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".");

  // لو كان الجزء الأول من الدومينات الجذر، ما فيه كافيه
  if (parts.length < 3) return null; // مثل: yourbrand.com أو localhost
  const sub = parts[0];
  if (ROOT_HOSTS.includes(sub)) return null;

  return sub; // مثل: cafe-name.yourbrand.com → "cafe-name"
}

/** استخراج slug الكافيه من المسار المؤقت /c/[slug] */
export function getCafeSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/c\/([a-z0-9-]+)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * الدالة الرئيسية: تعطيها الـ host والـ pathname وترجع slug الكافيه.
 * تجرّب الدومين الفرعي أولاً، وإلا المسار المؤقت.
 */
export function resolveCafeSlug(
  host: string | null,
  pathname: string
): string | null {
  return getCafeSlugFromHost(host) ?? getCafeSlugFromPath(pathname);
}
