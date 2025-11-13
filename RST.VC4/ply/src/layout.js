'use client'
import { Geist, Geist_Mono } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "@/styles/globals.css";
import { AuthProvider } from "@/context/authprovider";
import ToastProvider from "@/components/toastprovider";


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin:0}}>
              <AuthProvider>{children}</AuthProvider>
              <ToastProvider />
      </body>
    </html>
  );
}
