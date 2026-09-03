import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Badminton Stats",
    short_name: "Badminton",

    description:
      "Match logger og statistik for Christopher & Niels Badmintonklub",

    start_url: "/",
    scope: "/",

    display: "standalone",

    background_color: "#07111f",
    theme_color: "#07111f",

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },

      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },

      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
