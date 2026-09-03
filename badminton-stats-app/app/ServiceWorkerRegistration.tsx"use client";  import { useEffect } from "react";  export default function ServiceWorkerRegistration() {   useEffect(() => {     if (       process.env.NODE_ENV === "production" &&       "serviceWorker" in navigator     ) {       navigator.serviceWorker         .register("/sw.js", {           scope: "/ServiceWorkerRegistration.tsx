"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((registration) => {
          void registration.update();
        })
        .catch((error) => {
          console.error(
            "Service worker registration failed:",
            error
          );
        });
    }
  }, []);

  return null;
}
