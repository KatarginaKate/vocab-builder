import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import StoreProvider from "@/store/StoreProvider";

async function DictionaryStore({ children }: { children: ReactNode }) {
  await connection();
  return <StoreProvider>{children}</StoreProvider>;
}

export default function DictionaryLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}><DictionaryStore>{children}</DictionaryStore></Suspense>;
}
