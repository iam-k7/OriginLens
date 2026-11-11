import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "OriginLens — Free AI image checker and metadata viewer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share preview for links to the site: logo, name and what it does, in the site's colours. */
export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo-mark.svg"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "80px", background: "#16120F", color: "#F7F5EF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img elements */}
          <img src={`data:image/svg+xml;base64,${logo.toString("base64")}`} width={96} height={96} alt="" />
          <span style={{ fontSize: 64, fontWeight: 700 }}>OriginLens</span>
        </div>
        <div style={{ marginTop: 48, fontSize: 56, lineHeight: 1.15, maxWidth: 960 }}>
          Is this image AI-generated? See what a file really carries.
        </div>
        <div style={{ marginTop: 32, fontSize: 30, color: "#FF6A00" }}>
          Free AI image checker · Content Credentials · Metadata viewer
        </div>
      </div>
    ),
    size,
  );
}
