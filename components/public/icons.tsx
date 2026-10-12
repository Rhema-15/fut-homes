// Lucide icons (lucide.dev, ISC licence), inlined so there's no icon
// library to download. Colour follows the surrounding text.
import type { SVGProps } from "react";

const PATHS = {
  search: ["M21 21l-4.3-4.3", "circle:11,11,8"],
  "map-pin": ["M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0", "circle:12,10,3"],
  navigation: ["poly:3 11 22 2 13 21 11 13 3 11"],
  "shield-check": [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    "m9 12 2 2 4-4",
  ],
  "shield-alert": [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    "M12 8v4",
    "M12 16h.01",
  ],
  play: ["poly:6 3 20 12 6 21 6 3"],
  "arrow-left": ["m12 19-7-7 7-7", "M19 12H5"],
  "chevron-left": ["m15 18-6-6 6-6"],
  "chevron-right": ["m9 18 6-6-6-6"],
  share: ["circle:18,5,3", "circle:6,12,3", "circle:18,19,3", "m8.59 13.51 6.83 3.98", "m15.41 6.51-6.82 3.98"],
  "message-circle": ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
  sliders: ["M21 4h-7", "M10 4H3", "M21 12h-9", "M8 12H3", "M21 20h-5", "M12 20H3", "M14 2v4", "M8 10v4", "M16 18v4"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  check: ["M20 6 9 17l-5-5"],
  "search-x": ["circle:11,11,8", "m21 21-4.3-4.3", "m13.5 8.5-5 5", "m8.5 8.5 5 5"],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  ...rest
}: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  const filled = name === "play";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name].map((d) => {
        if (d.startsWith("circle:")) {
          const [cx, cy, r] = d.slice(7).split(",");
          return <circle key={d} cx={cx} cy={cy} r={r} />;
        }
        if (d.startsWith("poly:")) return <polygon key={d} points={d.slice(5)} />;
        return <path key={d} d={d} />;
      })}
    </svg>
  );
}
