import { LinjeTuneRouteClient } from "./tunelab/LinjeTuneRouteClient";

export const metadata = {
  title: "LinjeTune | Linje",
  description: "Local browser tuning and paint tool for Forza-style setups.",
};

export default function Home() {
  return (
    <main className="tunelab-route">
      <LinjeTuneRouteClient />
    </main>
  );
}
