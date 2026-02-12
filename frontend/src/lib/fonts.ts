import { Inter, Instrument_Serif, Montserrat } from "next/font/google";

export const inter = Inter({ subsets: ["latin"] });

export const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "800"],
  variable: "--font-montserrat",
  display: "swap",
});
