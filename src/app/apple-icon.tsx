import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f1a14",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#5fd99a",
            width: 140,
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 9999,
            fontSize: 52,
            fontWeight: 700,
            color: "#0f1a14",
          }}
        >
          NS
        </div>
      </div>
    ),
    { ...size },
  );
}
