export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          fontSize: "64px",
          lineHeight: 1,
        }}
      >
        ☕
      </div>
      <h1 style={{ fontSize: "32px", fontWeight: 800 }}>الولاء</h1>
      <p style={{ color: "var(--muted)", maxWidth: "420px", lineHeight: 1.8 }}>
        نظام ولاء ومكافآت للكافيهات. النظام يعمل بنجاح ✅
      </p>
      <div
        style={{
          background: "var(--card)",
          borderRadius: "16px",
          padding: "20px 24px",
          marginTop: "16px",
          maxWidth: "420px",
          width: "100%",
        }}
      >
        <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.9 }}>
          للدخول لكافيه معيّن أثناء التطوير:
          <br />
          <code style={{ color: "var(--primary)", fontWeight: 700 }}>
            /c/&lt;اسم-الكافيه&gt;
          </code>
        </p>
      </div>
    </main>
  );
}
