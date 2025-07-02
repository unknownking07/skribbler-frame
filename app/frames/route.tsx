// app/frames/route.tsx
import { frames } from "frames.js/next";
import { POST } from "./frames";

export const runtime = "edge";

export const GET = frames();
export { POST };
