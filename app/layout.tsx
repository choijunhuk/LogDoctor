import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "LogDoctor — 서버 로그 분석 도구",
  description:
    "서버 에러 로그를 붙여넣으면 원인 후보와 해결 절차를 정리해주는 개발자 도구. 룰 기반 분석, 민감정보 자동 마스킹.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
