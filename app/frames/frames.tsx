// app/frames/frames.tsx  (NO default export)
import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";
import type { ReactElement } from "react";

export const frames = createFrames({ basePath: "/frames" });

/* helper: returns a tuple of 1‑4 buttons, satisfying frames.js types */
function makeButtons(...btns: [ReactElement]): [ReactElement];
function makeButtons(...btns: [ReactElement, ReactElement]): [
  ReactElement,
  ReactElement
];
function makeButtons(...btns: [ReactElement, ReactElement, ReactElement]): [
  ReactElement,
  ReactElement,
  ReactElement
];
function makeButtons(
  ...btns: [ReactElement, ReactElement, ReactElement, ReactElement]
): [ReactElement, ReactElement, ReactElement, ReactElement];
function makeButtons(...btns: ReactElement[]) {
  return btns as any;
}

/* ------------------------------------------------------------------ */
/*  Frame handler ‑ MUST be exported so route.tsx can import it       */
/* ------------------------------------------------------------------ */
export const handleRequest = frames(async (ctx) => {
  const { searchParams } = new URL(ctx.request.url);
  const gameId = searchParams.get("gameId");

  /* 1. Fast‑fail if no gameId */
  if (!gameId) {
    return ctx.render({
      image: "",
      buttons: makeButtons(
        <Button action="post">Missing gameId</Button>
      ),
    });
  }

  /* 2. Fetch game */
  const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game || Object.keys(game).length === 0) {
    return ctx.render({
      image: "",
      buttons: makeButtons(
        <Button action="post">Game not found</Button>
      ),
    });
  }

  const { drawing = "", answer = "", choices = "[]" } = game;

  /* 3. Parse choices */
  let parsedChoices: string[];
  try {
    const arr = JSON.parse(choices);
    parsedChoices = Array.isArray(arr) ? arr.slice(0, 3) : [];
  } catch {
    return ctx.render({
      image: "",
      buttons: makeButtons(
        <Button action="post">Invalid choices data</Button>
      ),
    });
  }

  /* 4. Guess result */
  const guess = ctx.message?.buttonIndex; // 0‑based already
  const guessedCorrectly =
    guess !== undefined && parsedChoices[guess] === answer;

  /* 5. Build buttons */
  const buttons = guessedCorrectly
    ? makeButtons(
        <Button action="link" target="https://warpcast.com/frames">
          ✅ Correct!
        </Button>
      )
    : makeButtons(
        ...parsedChoices.map((c) => (
          <Button action="post" key={c}>
            {c}
          </Button>
        ))
      );

  /* 6. Render frame */
  return ctx.render({
    image: drawing,
    buttons,
  });
});

/* ---- EXPLICIT export for route.tsx ---- */
export { handleRequest };
