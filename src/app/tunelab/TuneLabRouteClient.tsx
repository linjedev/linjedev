"use client";

import dynamic from "next/dynamic";

const TuneLab = dynamic(() => import("@/features/tunelab/TuneLab"), {
  ssr: false,
});

export function TuneLabRouteClient() {
  return <TuneLab />;
}
