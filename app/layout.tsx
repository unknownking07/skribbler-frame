// app/layout.tsx
import "./globals.css";             // global styles
import Ready from "./_components/Ready"; // ⬅️ client wrapper that calls sdk.actions.ready()

export const metadata = {
  title: "Skribbler Frame",
  description: "A simple Skribbl‑like game for Farcaster Mini Apps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Signal to Farcaster that the page has loaded */}
        <Ready />
        {children}
      </body>
    </html>
  );
}
