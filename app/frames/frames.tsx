// app/frames/frames.tsx
import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";
import type { ReactElement } from "react";

export const frames = createFrames({ basePath: "/frames" });

/* Helper to satisfy frames.js tuple typing */
function makeButtons<T extends [...ReactElement[]]>(...btns: T): T {
  return btns;
}

export const handleRequest = frames(async (ctx) => {
  const { searchParams } = new URL(ctx.request.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) throw new Error("Missing gameId");

  const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game || Object.keys(game).length === 0) throw new Error("Game not found");

  const { drawing, answer, choices } = game;

  let parsedChoices: string[];
  try {
    parsedChoices = JSON.parse(choices).slice(0, 3); // show up to 3 buttons
  } catch {
    throw new Error("Invalid choices data");
  }

  const guess = ctx.message?.buttonIndex; // already 0‑based
  const guessedCorrectly =
    guess !== undefined && parsedChoices[guess] === answer;

  const buttons = guessedCorrectly
    ? makeButtons(
        <Button action="link" target="https://warpcast.com/frames">
          ✅ Correct!
        </Button>
      )
    : makeButtons(
        ...parsedChoices.map((c) => <Button action="post">{c}</Button>)
      );

  return ctx.render({
    image: drawing, // data-URL or http(s) URL
    buttons,
  });
});