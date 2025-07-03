import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";

export const frames = createFrames({ basePath: "/frames" });

/** Helper to ensure 1-4 valid buttons */
function makeButtons(...buttons: ReturnType<typeof Button>[]) {
  if (buttons.length < 1 || buttons.length > 4) {
    throw new Error("Buttons must be between 1 and 4");
  }
  return buttons;
}

export const handleRequest = frames(async (ctx) => {
  const { searchParams } = new URL(ctx.request.url);
  const gameId = searchParams.get("gameId");

  // 1. If gameId is missing
  if (!gameId) {
    const btn = Button({ action: "post", children: "Missing gameId" });
    return {
      image: "",
      buttons: makeButtons(btn),
    };
  }

  // 2. Fetch game from Redis
  const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game || Object.keys(game).length === 0) {
    const btn = Button({ action: "post", children: "Game not found" });
    return {
      image: "",
      buttons: makeButtons(btn),
    };
  }

  const { drawing = "", answer = "", choices = "[]" } = game;

  // 3. Parse choices
  let parsedChoices: string[];
  try {
    const arr = JSON.parse(choices);
    parsedChoices = Array.isArray(arr) ? arr.slice(0, 4) : [];
  } catch {
    const btn = Button({ action: "post", children: "Invalid choices data" });
    return {
      image: "",
      buttons: makeButtons(btn),
    };
  }

  if (parsedChoices.length === 0) {
    const btn = Button({ action: "post", children: "No choices available" });
    return {
      image: "",
      buttons: makeButtons(btn),
    };
  }

  // 4. Check guess
  const guess = ctx.message?.buttonIndex;
  const guessedCorrectly =
    guess !== undefined && parsedChoices[guess - 1] === answer;

  // 5. Set buttons
  const buttons = guessedCorrectly
    ? makeButtons(
        Button({
          action: "link",
          target: "https://warpcast.com/frames",
          children: "✅ Correct!",
        }),
      )
    : makeButtons(
        ...parsedChoices.map((choice) =>
          Button({ action: "post", children: choice }),
        ),
      );

  // 6. Return frame
  return {
    image: drawing,
    buttons,
  };
});
