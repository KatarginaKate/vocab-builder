import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import StoreProvider from "@/store/StoreProvider";

async function TrainingStore({ children }: { children: ReactNode }) {
  await connection();
  return <StoreProvider>{children}</StoreProvider>;
}

export default function TrainingLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}><TrainingStore>{children}</TrainingStore></Suspense>;
}
