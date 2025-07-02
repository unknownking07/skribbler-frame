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
  
  // Fix: Check for empty object, not just null
  if (!game || Object.keys(game).length === 0) {
    throw new Error("Game not found");
  }
  
  const { drawing, answer, choices } = game;
  
  // Fix: Add error handling for JSON parsing
  let parsedChoices: string[];
  try {
    parsedChoices = JSON.parse(choices).slice(0, 3); // max 3
  } catch (error) {
    throw new Error("Invalid choices data");
  }
  
  // Button indices are 0-based in frames.js
  const guess = ctx.message?.buttonIndex;
  const guessedCorrectly = 
    guess !== undefined && parsedChoices[guess] === answer;
  
  const buttons = guessedCorrectly
    ? [
        <Button action="link" target="https://warpcast.com/frames">
          ✅ Correct!
        </Button>,
      ]
    : parsedChoices.map((c) => (
        <Button action="post">{c}</Button>
      ));
  
  return {
    image: drawing, // string (data‑URL)
    buttons,
  };
});