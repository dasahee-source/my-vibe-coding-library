import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dasahee-source.github.io/my-vibe-coding-library/"),
  title: "나의 바이브코딩 도서관",
  description: "내가 만든 바이브코딩 프로그램을 실행하고, 코드와 제작 과정을 한곳에서 살펴보세요.",
  openGraph: {
    title: "나의 바이브코딩 도서관",
    description: "내가 만든 프로그램과 제작 과정을 한눈에",
    images: [{ url: "/og.png", width: 1734, height: 907, alt: "나의 바이브코딩 도서관" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "나의 바이브코딩 도서관",
    description: "내가 만든 프로그램과 제작 과정을 한눈에",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
