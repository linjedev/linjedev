import { TuneLabRouteClient } from "./TuneLabRouteClient";

export const metadata = {
  title: "TuneLab | Linje",
  description: "Local browser tuning and paint tool for Forza-style setups.",
};

export default function TuneLabPage() {
  return (
    <main className="tunelab-route">
      <TuneLabRouteClient />
    </main>
  );
}
