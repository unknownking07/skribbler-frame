import { redis } from "@/lib/db";
import type { ReactElement } from "react";

// Initialize frames with basePath
export const frames = createFrames({ basePath: "/frames" });

/**
 * Helper to satisfy frames.js tuple typing.
 * This ensures TypeScript can infer the correct tuple type for buttons.
 */
function makeButtons<T extends ReactElement[]>(...btns: T): T {
return btns;
}

export const handleRequest = frames(async (ctx) => {
const { searchParams } = new URL(ctx.request.url);
const gameId = searchParams.get("gameId");
  if (!gameId) {
    return ctx.render({
      image: "", // Provide a fallback
      buttons: makeButtons(
        <Button action="post" key="missing-gameId">
          Missing gameId
        </Button>
      ),
    });
  }

const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game || Object.keys(game).length === 0) {
    return ctx.render({
      image: "", // Provide a fallback
      buttons: makeButtons(
        <Button action="post" key="not-found">
          Game not found
        </Button>
      ),
    });
  }

const { drawing, answer, choices } = game;

let parsedChoices: string[];
try {
    parsedChoices = Array.isArray(choices)
      ? choices.slice(0, 3)
      : JSON.parse(choices).slice(0, 3);
} catch {
    return ctx.render({
      image: "", // Provide a fallback
      buttons: makeButtons(
        <Button action="post" key="invalid-choices">
          Invalid choices data
        </Button>
      ),
    });
}

  const guess = ctx.message?.buttonIndex; // already 0-based
const guessedCorrectly =
    guess !== undefined &&
    typeof guess === "number" &&
    parsedChoices[guess] === answer;

const buttons = guessedCorrectly
? makeButtons(
        <Button
          action="link"
          target="https://warpcast.com/frames"
          key="correct"
        >
✅ Correct!
</Button>
)
@@ -45,7 +82,7 @@ export const handleRequest = frames(async (ctx) => {
);

return ctx.render({
    image: drawing || "", // Fallback in case drawing is missing
buttons,
});
});
