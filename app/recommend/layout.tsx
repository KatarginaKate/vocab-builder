import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import StoreProvider from "@/store/StoreProvider";

async function RecommendStore({ children }: { children: ReactNode }) {
  await connection();
  return <StoreProvider>{children}</StoreProvider>;
}

export default function RecommendLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}><RecommendStore>{children}</RecommendStore></Suspense>;
}
