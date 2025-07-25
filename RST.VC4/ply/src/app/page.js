'use client'

import { useAuth } from '@/context/authprovider'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "react-bootstrap";
import PlyNavbar from "@/components/plynavbar";
import "./globals.css";
import Loader from '@/components/loader';
import { getWithAuth } from '@/utils/api';
import { APIURLS } from '@/utils/config';
export default function Home() {
    const [redirectUrl, setRedirectUrl] = useState("");
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const [dummy, setDummy] = useState(null);
    const [mysites, setMysites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchMySites() {
            setLoading(true);
            setError('');
            var r = await getWithAuth(`${APIURLS.userWebsite}/mywebsites`, router);
            if (r.result) {
                setMysites(r.data);
            } else {
                setError(r.errors.join(', '));
            }
            setLoading(false);
        }
        fetchMySites();
    }, []);

    useEffect(() => {
        if (redirectUrl) {
            router.push(redirectUrl);
        }
    }, [redirectUrl, router]);

    return (
        <>
            <PlyNavbar showLoginPopup={dummy} />
            {!isLoggedIn ? <div className="p-lg-4 p-2 text-center">
                <div className="my-md-5 my-4 hero-text merienda">Get your website for free!</div>
                <div className="text-center mb-4">
                    <button type="button" onClick={() => {
                        setDummy(Date.now());
                    }} className="btn btn-success btn-lg fs-1">Start Creating</button>
                </div>
            </div> : <div>
                <Container className="my-5">
                    {loading ? <Loader /> : null}
                    {error ? <div className="text-danger text-center my-2">{error}</div> : null}
                        {mysites.length > 0 ? (
                            <>
                        <h1 className="text-center mb-4">My Sites</h1>
                        <ul className="list-group">
                            {mysites.map((site, index) => (
                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                    <span>{site.name}</span>
                                    <button className="btn btn-primary" onClick={() => setRedirectUrl(site.url)}>Visit</button>
                                </li>
                            ))}
                        </ul></>
                        ) : !loading ? <>
                                <div className="text-center fs-4 py-3">You do not have any websites yet, this is the right time to start.</div>
                                <div className="text-center mt-3">
                                    <button type="button" onClick={() => {
                                        setRedirectUrl('/create');
                                    }} className="btn btn-success btn-lg fs-1">Create Your First Site</button>
                                </div>
                        </> : null}
                </Container>
            </div>}

        </>
    );
}