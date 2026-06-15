"use client";

import dynamic from "next/dynamic";

const LinjeTune = dynamic(() => import("@/features/tunelab/LinjeTune"), {
  ssr: false,
});

export function LinjeTuneRouteClient() {
  return <LinjeTune />;
}
