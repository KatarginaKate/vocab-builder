import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const fixelDisplay = localFont({
  src: [
    { path: "./fonts/MacPawFixelDisplay-Thin.otf", weight: "100" },
    { path: "./fonts/MacPawFixelDisplay-Light.otf", weight: "300" },
    { path: "./fonts/MacPawFixelDisplay-Regular.otf", weight: "400" },
    { path: "./fonts/MacPawFixelDisplay-Medium.otf", weight: "500" },
    { path: "./fonts/MacPawFixelDisplay-SemiBold.otf", weight: "600" },
    { path: "./fonts/MacPawFixelDisplay-Bold.otf", weight: "700" },
    { path: "./fonts/MacPawFixelDisplay-ExtraBold.otf", weight: "800" },
  ],
  variable: "--font-fixel-display",
});

export const metadata: Metadata = {
  title: "VocabBuilder — Learn new words every day",
  description:
    "Learn English at your own pace, find the words you need, and track your progress with VocabBuilder.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={fixelDisplay.variable}>
      <body>{children}</body>
    </html>
  );
}
