// app/frames/frames.tsx   ← keep the .tsx extension
import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";
import type { ReactElement } from "react";

export const frames = createFrames({
  basePath: "/frames",
});

export const handleRequest = frames(async (ctx) => {
  const { searchParams } = new URL(ctx.request.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) throw new Error("Missing gameId");

  const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game) throw new Error("Game not found");

  const { drawing, answer, choices } = game;
  const parsedChoices: string[] = JSON.parse(choices).slice(0, 3); // max 3

  const guess = ctx.message?.buttonIndex;
  const guessedCorrectly =
    guess !== undefined && parsedChoices[guess] === answer;

  const buttons = guessedCorrectly
    ? ([
        <Button action="link" target="https://warpcast.com/frames">
          ✅ Correct!
        </Button>,
      ] as const)                                // tuple length 1
    : (parsedChoices.map((c) => (
        <Button action="post">{c}</Button>       // ← removed value prop
      )) as [
        ReactElement,                            // tuple length 3
        ReactElement,
        ReactElement
      ]);

  return ctx.render({
    image: drawing, // string (data‑URL)
    buttons,
  });
});
