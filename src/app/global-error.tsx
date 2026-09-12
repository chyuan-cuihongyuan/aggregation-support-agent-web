"use client";

/**
 * 布局级崩溃兜底（SELFLOOP2 loop-206）。根布局被替换时全局 CSS（globals.css）
 * 不再加载，故本组件全部使用内联样式，确保视觉自洽。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[agg-web] 全局布局错误:", error);

  const buttonStyle: React.CSSProperties = {
    marginTop: 16,
    padding: "8px 16px",
    borderRadius: 6,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: 14,
    cursor: "pointer",
  };

  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: 24,
            borderRadius: 8,
            border: "1px solid #fecaca",
            background: "#fff",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: "#dc2626" }}>应用发生严重错误</h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "#64748b" }}>
            全局布局渲染失败，请尝试重试；若持续失败请刷新页面。
          </p>
          {error.digest ? (
            <p style={{ marginTop: 4, fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>
              digest: {error.digest}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button type="button" onClick={reset} style={buttonStyle}>
              重试
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ ...buttonStyle, background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0" }}
            >
              刷新页面
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
