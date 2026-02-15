"use client";

import { useEffect, useRef } from "react";
import { buildUrlManager } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";

export default function SearchUrlManager() {
  const controller = useRef(
    buildUrlManager(getSearchEngine(), {
      initialState: {
        fragment: typeof window !== "undefined" ? window.location.hash.slice(1) : "",
      },
    })
  ).current;

  useEffect(() => {
    const unsub = controller.subscribe(() => {
      const hash = controller.state.fragment;
      const currentHash = window.location.hash.slice(1);
      if (hash !== currentHash) {
        window.history.replaceState(null, "", hash ? `#${hash}` : window.location.pathname);
      }
    });

    const onHashChange = () => {
      controller.synchronize(window.location.hash.slice(1));
    };
    window.addEventListener("hashchange", onHashChange);

    return () => {
      unsub();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [controller]);

  return null;
}
