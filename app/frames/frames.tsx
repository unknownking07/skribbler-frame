// app/frames/frames.ts
import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";
import type { ReactElement } from "react";

export const frames = createFrames({
  basePath: "/frames", // important ‑ matches your route folder
});

export const handleRequest = frames(async (ctx) => {
  const { searchParams } = new URL(ctx.request.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) throw new Error("Missing gameId");

  const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game) throw new Error("Game not found");

  const { drawing, answer, choices } = game;
  const parsedChoices: string[] = JSON.parse(choices);

  const guess = ctx.message?.buttonIndex;
  const guessedCorrectly =
    guess !== undefined && parsedChoices[guess] === answer;

  const buttons = guessedCorrectly
    ? [
        <Button action="link" target="https://warpcast.com/frames">
          ✅ Correct!
        </Button>,
      ] as [ReactElement]
    : (parsedChoices.map((c, i) => (
        <Button action="post" value={String(i)}>
          {c}
        </Button>
      )) as [ReactElement, ReactElement, ReactElement]);

  return {
    image: drawing, // image as a string (valid URL)
    buttons,
  };
});
