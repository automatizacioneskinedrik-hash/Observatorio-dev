import localFont from "next/font/local";

export const neueMontreal = localFont({
  src: [
    { path: "../public/fonts/NeueMontreal-Regular.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/NeueMontreal-Medium.otf", weight: "500", style: "normal" },
  ],
  variable: "--font-neue-montreal",
  display: "swap",
});
