// app/frames/frames.tsx              ← keep the .tsx extension
import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";
import type { ReactElement } from "react";

export const frames = createFrames({
  basePath: "/frames",          // matches route folder
});

export const handleRequest = frames(async (ctx) => {
  const { searchParams } = new URL(ctx.request.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) throw new Error("Missing gameId");

  const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game) throw new Error("Game not found");

  const { drawing, answer, choices } = game;
  const parsedChoices: string[] = JSON.parse(choices).slice(0, 3); // max 3

  // ── Was this a guess? ──────────────────────────────────────────
  const guess = ctx.message?.buttonIndex;
  const guessedCorrectly =
    guess !== undefined && parsedChoices[guess] === answer;

  // ── Build buttons as a *tuple* so TS is happy ─────────────────
  const buttons = guessedCorrectly
    ? ([
        <Button action="link" target="https://warpcast.com/frames">
          ✅ Correct!
        </Button>,
      ] as const)                                            // tuple (len 1)
    : (parsedChoices.map((c, i) => (
        <Button action="post" value={String(i)}>
          {c}
        </Button>
      )) as [
        ReactElement,       // tuple (len 3) – adjust if you want 4 options
        ReactElement,
        ReactElement
      ]);

  // ── Return via ctx.render so typing matches FrameHandlerFunction ──
  return ctx.render({
    image: drawing,   // string (data‑URL)
    buttons,
  });
});
