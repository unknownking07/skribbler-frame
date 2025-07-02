// app/frames/frames.ts
import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";

export const frames = createFrames({
  basePath: "/frames",       // important ‑ matches your route folder
});

export const handleRequest = frames(async (ctx) => {
  const { searchParams } = new URL(ctx.request.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) throw new Error("Missing gameId");

  const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game) throw new Error("Game not found");

  const { drawing, answer, choices } = game;
  const parsedChoices: string[] = JSON.parse(choices);

  // Was this a guess?
  const guess = ctx.message?.buttonIndex;        // 0‑based index or undefined
  const guessedCorrectly = guess !== undefined && parsedChoices[guess] === answer;

  return {
    image: <img src={drawing} width="512" height="512" />,
    buttons: guessedCorrectly
      ? [<Button action="link" target="https://warpcast.com/frames">✅ Correct!</Button>]
      : parsedChoices.map((c) => <Button action="post">{c}</Button>),
  };
});
