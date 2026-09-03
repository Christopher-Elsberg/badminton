import type {
  Metadata,
  Viewport,
} from "next";

import "./globals.css";

import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: {
    default: "Badminton Stats",
    template: "%s | Badminton Stats",
  },

  description:
    "Badminton match logger og statistik",

  applicationName:
    "Badminton Stats",

  manifest:
    "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },

      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,

    title:
      "Badminton Stats",

    statusBarStyle:
      "black-translucent",
  },

  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",

  initialScale: 1,

  viewportFit: "cover",

  themeColor: "#07111f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body>
        <ServiceWorkerRegistration />

        {children}
      </body>
    </html>
  );
}
