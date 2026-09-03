import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BattleGrid Arena",
    short_name: "BattleGrid",
    description: "Player tournaments, match rooms, results and admin operations.",
    start_url: "/player",
    display: "standalone",
    background_color: "#0c0f14",
    theme_color: "#0c0f14",
    orientation: "portrait-primary",
    categories: ["sports", "entertainment"],
  };
}
