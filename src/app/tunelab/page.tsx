import { TuneLabRouteClient } from "./TuneLabRouteClient";

export const metadata = {
  title: "LinjeTune | Linje",
  description: "Local browser tuning and paint tool for Forza-style setups.",
};

export default function LinjeTunePage() {
  return (
    <main className="tunelab-route">
      <TuneLabRouteClient />
    </main>
  );
}
