// app/draw/page.tsx
"use client";

import { useRef, useState } from "react";

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [word, setWord] = useState("");

  const handleClear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 300, 300);
    }
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !word) return alert("Please enter a word and draw!");

    const drawing = canvas.toDataURL("image/png");

    const res = await fetch("/api/create-game", {
      method: "POST",
      body: JSON.stringify({ drawing, word }),
    });

    const data = await res.json();
    alert(`Your frame is ready! Copy this URL:\n\n${data.frameUrl}`);
  };

  return (
    <main style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Draw a word ✍️</h1>
      <input
        type="text"
        placeholder="Enter a word"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        style={{ padding: 8, marginTop: 10, width: 300 }}
      />
      <div style={{ marginTop: 20 }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{ border: "1px solid #000", background: "#fff" }}
          onMouseDown={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            let painting = true;

            const draw = (event: MouseEvent) => {
              if (!painting) return;
              const rect = canvas.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const y = event.clientY - rect.top;
              ctx.lineWidth = 4;
              ctx.lineCap = "round";
              ctx.lineTo(x, y);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(x, y);
            };

            const stopDrawing = () => {
              painting = false;
              ctx?.beginPath();
              canvas.removeEventListener("mousemove", draw);
              canvas.removeEventListener("mouseup", stopDrawing);
            };

            painting = true;
            draw(e.nativeEvent);
            canvas.addEventListener("mousemove", draw);
            canvas.addEventListener("mouseup", stopDrawing);
          }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleClear} style={{ marginRight: 10 }}>
          Clear
        </button>
        <button onClick={handleSubmit}>Submit Drawing</button>
      </div>
    </main>
  );
}
