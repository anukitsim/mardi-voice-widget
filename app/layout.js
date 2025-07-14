import { Noto_Sans_Georgian, Poppins } from "next/font/google";
import "./globals.css";

const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-sans-georgian",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Mardi Voice Assistant Widget",
  description: "Production-ready voice assistant widget for Mardi Holding",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${notoSansGeorgian.variable} ${poppins.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
