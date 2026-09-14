import type { Metadata } from "next";
import "./globals.css";
import "./products.css";
import "./toy-v2.css";
import "./features.css";
import "./v3.css";

export const metadata: Metadata = {
  title: "Cash Register | Sales Dashboard",
  description: "Interactive toy store sales dashboard and cash register",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ms"><body>{children}</body></html>;
}
