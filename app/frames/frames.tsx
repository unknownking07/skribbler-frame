// app/frames/frames.tsx
import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";
import type { ReactElement } from "react";

/* ------------------------------------------------------------------ */
/* 1. Initialise frames                                               */
/* ------------------------------------------------------------------ */
export const frames = createFrames({ basePath: "/frames" });

/* ------------------------------------------------------------------ */
/* 2. Helper – return a *typed tuple* of 1‑4 <Button> elements        */
/*    Overloads satisfy the union type frames.js expects.             */
/* ------------------------------------------------------------------ */
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
  // The overload signatures above guarantee the tuple length (1‑4),
  // so we can cast back to `any` here.
  return btns as any;
}

/* ------------------------------------------------------------------ */
/* 3. Frame handler                                                   */
/* ------------------------------------------------------------------ */
export const handleRequest = frames(async (ctx) => {
  const { searchParams } = new URL(ctx.request.url);
  const gameId = searchParams.get("gameId");

  /* ----- 3a.  Fast‑fail if no gameId ------------------------------ */
  if (!gameId) {
    return ctx.render({
      image: "",
      buttons: makeButtons(
        <Button action="post">Missing gameId</Button>
      ),
    });
  }

  /* ----- 3b.  Fetch game from Redis ------------------------------- */
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

  /* ----- 3c.  Parse choices safely -------------------------------- */
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

  /* ----- 3d.  Determine guess result ------------------------------ */
  const guess = ctx.message?.buttonIndex; // already 0‑based
  const guessedCorrectly =
    guess !== undefined && parsedChoices[guess] === answer;

  /* ----- 3e.  Build buttons (tuple) ------------------------------- */
  const buttons = guessedCorrectly
    ? makeButtons(
        <Button action="link" target="https://warpcast.com/frames">
          ✅ Correct!
        </Button>
      )
    : makeButtons(
        ...parsedChoices.map((choice) => (
          <Button action="post" key={choice}>
            {choice}
          </Button>
        ))
      );

  /* ----- 3f.  Render frame ---------------------------------------- */
  return ctx.render({
    image: drawing,    // data‑URL or http(s) URL
    buttons,
  });
});
