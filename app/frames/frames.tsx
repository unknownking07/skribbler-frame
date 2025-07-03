// app/frames/frames.tsx
import { createFrames, Button } from "frames.js/next";
import { redis } from "@/lib/db";
import type { ReactElement } from "react";

export const frames = createFrames({ basePath: "/frames" });

function makeButtons(...btns: [ReactElement]): [ReactElement];
function makeButtons(...btns: [ReactElement, ReactElement]): [ReactElement, ReactElement];
function makeButtons(...btns: [ReactElement, ReactElement, ReactElement]): [ReactElement, ReactElement, ReactElement];
function makeButtons(...btns: [ReactElement, ReactElement, ReactElement, ReactElement]): [ReactElement, ReactElement, ReactElement, ReactElement];
function makeButtons(...btns: ReactElement[]) {
  return btns as any;
}

// The handler below is rewritten to return a React element directly
export default async function FramesPage({ searchParams }: { searchParams: { [key: string]: string } }) {
  const gameId = searchParams.gameId;

  // 3a. Fast-fail if no gameId
  if (!gameId) {
    return (
      <div>
        <img src="" alt="No game" />
        <div>
          <Button action="post">Missing gameId</Button>
        </div>
      </div>
    );
  }

  // 3b. Fetch game from Redis
  const game = await redis.hgetall<Record<string, string>>(`game:${gameId}`);
  if (!game || Object.keys(game).length === 0) {
    return (
      <div>
        <img src="" alt="Not found" />
        <div>
          <Button action="post">Game not found</Button>
        </div>
      </div>
    );
  }

  const { drawing = "", answer = "", choices = "[]" } = game;

  // 3c. Parse choices safely
  let parsedChoices: string[];
  try {
    const arr = JSON.parse(choices);
    parsedChoices = Array.isArray(arr) ? arr.slice(0, 3) : [];
  } catch {
    return (
      <div>
        <img src="" alt="Invalid choices" />
        <div>
          <Button action="post">Invalid choices data</Button>
        </div>
      </div>
    );
  }

  // 3d. Guess logic is omitted here - you likely want to move it to a POST API handler or similar

  // 3e. Build buttons (tuple)
  const buttons = parsedChoices.map((choice) => (
    <Button action="post" key={choice}>
      {choice}
    </Button>
  ));

  // 3f. Render frame
  return (
    <div>
      <img src={drawing} alt="Drawing" />
      <div>{buttons}</div>
    </div>
  );
}
