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
import { StatusDisplay } from '@/components/statusdisplay';
import Swal from 'sweetalert2';
import useAppStore from '@/store/useAppStore';

export default function Home() {
    const [redirectUrl, setRedirectUrl] = useState("");
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const [dummy, setDummy] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [error, setError] = useState('');
    const { setDesigns, designs, deleteDesign } = useAppStore();

    useEffect(() => {
        const loadDesigns = async () => {
            const res = await getWithAuth(`${APIURLS.userWebsite}/mywebsites`, router);
            if (res.result && res.data) {
                setDesigns(res.data);
            } else {
                setError(res.errors.join(', '));
            }
        };
        setLoading(true);
        loadDesigns(); // initial load
        setLoading(false);
        const interval = setInterval(loadDesigns, 10000); // background refresh every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (redirectUrl) {
            router.push(redirectUrl);
        }
    }, [redirectUrl, router]);

    const deleteItem = async (id) => {
        setLoadingDelete(true);
        setError('');
        var r = await getWithAuth(`${APIURLS.userWebsite}/delete/${id}`, router, { checkResponseBody : false});
        if (r.result) {
            deleteDesign(id);
        } else {
            setError(r.errors.join(', '));
        }
        setLoadingDelete(false);
    }

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to undo this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // ✅ Proceed with delete
                deleteItem(id);
            } else {
                // ❌ Cancelled
                console.log('User cancelled deletion');
            }
        });
    };


    return (
        <>
            <PlyNavbar showLoginPopup={dummy} />
            {!isLoggedIn ? <div className="p-lg-4 p-2 text-center">
                <div className="my-md-5 my-4 hero-text merienda">Get your website for free!</div>
                <div className="text-center mb-4">
                    <button type="button" onClick={() => {
                        setDummy(Date.now());
                    }} className="btn btn-success fs-1">Start Creating</button>
                </div>
            </div> : <div>
                <Container className="my-5">
                    {loading ? <Loader /> : null}
                        {error ? <div className="text-danger text-center my-2">{error}</div> : null}
                        {!loading ? <>{designs.length > 0 ? (
                            <>
                                <div className="mb-4 d-flex "><h1 className="me-auto">My Sites</h1>
                                    <div className="p-2 flex-shrink-1">
                                        <button type="button" onClick={() => {
                                            setRedirectUrl('/create');
                                        }} className="btn btn-success">Create A Site</button>
                                    </div></div>

                                <table className="table">
                                    <thead >
                                        <tr>
                                            <th>Website Name</th>
                                            <th>Created</th>
                                            <th>Status</th>
                                            <th colSpan={2}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {designs.map((site, index) => (
                                            <tr key={index}>
                                                <td><a href={`https://${site.name}.vc4.in`} target="_blank">{site.name}</a></td>
                                                <td>
                                                    {new Date(site.created).toLocaleDateString()}
                                                    {site.modified ? <div className="text-muted"> (Last modified: {new Date(site.modified).toLocaleDateString()})</div> : null}
                                                </td>
                                                <td><StatusDisplay status={site.status} /></td>
                                                <td>
                                                    <button type="button" className="btn btn-link text-dark" disabled={loading || loadingDelete} onClick={() => setRedirectUrl(`/editcard?id=${site.id}`)}><i className="bi bi-pencil-square"></i></button>
                                                </td>
                                                <td><button type="button" className="btn btn-link text-danger" disabled={loading || loadingDelete} onClick={() => { handleDelete(site.id); }}><i className="bi bi-trash3"></i></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table></>
                        ) : <>
                            <div className="text-center fs-4 py-3">You do not have any websites yet, this is the right time to start.</div>
                            <div className="text-center mt-3">
                                <button type="button" onClick={() => {
                                    setRedirectUrl('/create');
                                }} className="btn btn-success btn-lg fs-1">Create Your First Site</button>
                            </div>
                        </>}</> : <>Loading websites...</>}
                        
                </Container>
            </div>}

        </>
    );
}