import { Geist, Geist_Mono } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";
import { AuthProvider } from "./context/authprovider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ply",
  description: "Create and manage your websites effortlessly with Ply, the ultimate website builder by Rudra Softtech.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin:0}}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
