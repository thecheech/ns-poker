import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#5fd99a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9999,
          fontSize: 13,
          fontWeight: 700,
          color: "#0f1a14",
        }}
      >
        NS
      </div>
    ),
    { ...size },
  );
}
