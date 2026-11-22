"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { esNativo } from "@ruum/api/capacitor";
import { App } from "@capacitor/app";

export function DeepLinksBootstrap() {
  const router = useRouter();

  useEffect(() => {
    if (!esNativo()) return;

    let sub: { remove: () => Promise<void> } | null = null;
    void App.addListener("appUrlOpen", (data) => {
      try {
        const url = new URL(data.url);
        const ruta = (url.pathname || "/") + url.search + url.hash;
        if (ruta.startsWith("/")) router.push(ruta);
      } catch {
        const match = data.url.match(/:\/\/[^/]+(\/.*)/);
        const ruta = match ? match[1] : data.url;
        if (ruta && ruta.startsWith("/")) router.push(ruta);
      }
    }).then((s) => {
      sub = s;
    });

    return () => {
      void sub?.remove();
    };
  }, [router]);

  return null;
}
