// app/page.tsx
export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Skribbler 🎨</h1>
      <p>Click below to draw a word!</p>
      <a
        href="/draw"
        style={{
          display: "inline-block",
          marginTop: 20,
          padding: 10,
          background: "#000",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 5,
        }}
      >
        Start Drawing
      </a>
    </main>
  );
}
