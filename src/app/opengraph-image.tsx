import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Why did the router pick that model?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #f4f6f8 0%, #d8f3e7 45%, #dbeafe 100%)",
          color: "#14212b",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#0f6e56", fontWeight: 600 }}>
          Weave Decision Explorer
        </div>
        <div style={{ marginTop: 24, fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          Why did the router pick that model?
        </div>
        <div style={{ marginTop: 28, fontSize: 24, color: "#5b6b76", maxWidth: 800 }}>
          Unofficial read-only analytics explorer · not affiliated with Weave
        </div>
      </div>
    ),
    { ...size },
  );
}
