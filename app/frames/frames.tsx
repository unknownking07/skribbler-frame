// app/frames/frames.tsx
import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";
import type { ReactElement } from "react";

export const frames = createFrames({ basePath: "/frames" });

export const handleRequest = frames(async (ctx) => {
  const { searchParams } = new URL(ctx.request.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) throw new Error("Missing gameId");

  const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game || Object.keys(game).length === 0) throw new Error("Game not found");

  const { drawing, answer, choices } = game;

  let parsedChoices: string[];
  try {
    parsedChoices = JSON.parse(choices).slice(0, 3); // max 3 buttons
  } catch {
    throw new Error("Invalid choices data");
  }

  // 0‑based index from frames.js
  const guess = ctx.message?.buttonIndex;
  const guessedCorrectly =
    guess !== undefined && parsedChoices[guess] === answer;

  const buttons = guessedCorrectly
    ? ([
        <Button action="link" target="https://warpcast.com/frames">
          ✅ Correct!
        </Button>,
      ] as const) // tuple length = 1
    : (parsedChoices.map((c) => (
        <Button action="post">{c}</Button>
      )) as [
        ReactElement,
        ReactElement,
        ReactElement
      ]); // tuple length = 3

  return ctx.render({
    image: drawing,
    buttons,
  });
});
