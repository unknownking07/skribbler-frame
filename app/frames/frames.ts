// app/frames/frames.ts
import { redis } from "@/lib/db";
import { Button, Frame, TextInput } from "frames.js/next";
import { getFrameMessage } from "frames.js";

export async function POST(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const gameId = url.searchParams.get("gameId");
  const message = await getFrameMessage(req);

  if (!message || !gameId) {
    return new Response("Invalid request", { status: 400 });
  }

  const game = await redis.get(gameId);
  if (!game) {
    return new Response("Game not found", { status: 404 });
  }

  const { drawing, choices, correctAnswerIndex } = game as any;
  const userGuess = message.input;

  const guessedCorrectly = userGuess?.toLowerCase() === choices[correctAnswerIndex].toLowerCase();

  return new Frame({
    image: drawing,
    imageAspectRatio: "square",
    input: guessedCorrectly ? undefined : TextInput({ placeholder: "Your guess..." }),
    buttons: [
      guessedCorrectly
        ? Button.Link({ label: "✅ Correct!", url: "https://warpcast.com/frames" })
        : Button.Submit({ label: "Guess" }),
    ],
  }).toResponse();
}
