import type { Metadata } from "next";
import "./globals.css";
import "./products.css";

export const metadata: Metadata = {
  title: "Cash Register | Sales Dashboard",
  description: "Interactive daily sales dashboard and cash register",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ms"><body>{children}</body></html>;
}
