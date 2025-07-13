'use client'

import { useAuth } from './context/authprovider'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "react-bootstrap";
import PlyNavbar from "./plynavbar";
import "./globals.css";

export default function Home() {
    const [redirectUrl, setRedirectUrl] = useState("");
    const router = useRouter();
    const { isLoggedIn, logout } = useAuth()

    useEffect(() => {
        if (redirectUrl) {
            router.push(redirectUrl);
        }
    }, [redirectUrl, router]);

    return (
        <>
            <PlyNavbar />
            <div className="p-lg-4 p-2 text-center">
                <div className="my-md-5 my-4 hero-text">Get your website for free!</div>
                <div className="text-center mb--">
                    <button type="button" onClick={() => {
                        if(isLoggedIn) {
                            setRedirectUrl("/dashboard");
                        } else {
                            setRedirectUrl("/login");
                        }
                    }} className="btn btn-primary btn-lg">Start Creating</button>
                </div>
            </div>
        </>
    );
}