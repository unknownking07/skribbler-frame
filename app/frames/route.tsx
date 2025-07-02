// app/frames/route.tsx
import { handleRequest } from "./frames";

export const runtime = "edge";

export const GET = handleRequest;
export const POST = handleRequest;
