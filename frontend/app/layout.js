import "./globals.css";

export const metadata = {
  title: "CRM AI",
  description: "AI-powered CRM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
