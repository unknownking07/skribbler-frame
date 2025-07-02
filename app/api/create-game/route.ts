import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/db";
import { WORDS } from "@/lib/words";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { drawing, word } = await req.json();

    if (!drawing || !word) {
      return NextResponse.json(
        { error: "Missing drawing or word" },
        { status: 400 }
      );
    }

    const gameId = uuidv4();
    const choices = shuffle([
      word,
      WORDS[Math.floor(Math.random() * WORDS.length)],
      WORDS[Math.floor(Math.random() * WORDS.length)],
    ]);

    await redis.hset(`game:${gameId}`, {
      drawing,
      answer: word,
      choices: JSON.stringify(choices),
    });

    const frameUrl = `${process.env.NEXT_PUBLIC_HOST}/frames?gameId=${gameId}`;
    return NextResponse.json({ frameUrl });
  } catch (err) {
    console.error("❌ Error in /api/create-game:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}
