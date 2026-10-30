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
          padding: 80,
          background: "#141414",
          color: "#ececec",
          fontFamily: "Geist, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#ff6c47",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "#ff6c47",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            ✦
          </div>
          Decision Explorer
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 58,
            fontWeight: 500,
            lineHeight: 1.08,
            maxWidth: 920,
            letterSpacing: "-0.035em",
          }}
        >
          Why did the router pick that model?
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 20,
            color: "#a0a0a0",
            maxWidth: 760,
            letterSpacing: "-0.015em",
          }}
        >
          Unofficial read-only analytics explorer · not affiliated with Weave
        </div>
      </div>
    ),
    { ...size },
  );
}
