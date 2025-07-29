'use client'

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getWithAuth } from '@/utils/api';
import { APIURLS } from '@/utils/config';
import PlyNavbar from '@/components/plynavbar';
import Loader from '@/components/loader';

const EditCompany = ({ company, tagLine, logo, id }) => {

};

export default function EditSite() {
    const [redirectUrl, setRedirectUrl] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id'); // Access a specific query parameter

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [website, setWebsite] = useState(null);
    const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);

    useEffect(() => {
        if (redirectUrl) {
            router.push(redirectUrl);
        }
    }, [redirectUrl, router]);

    useEffect(() => {
        async function fetchSite() {
            setLoading(true);
            setError('');
            var r = await getWithAuth(`${APIURLS.userWebsite}/${id}`, router);
            if (r.result) {
                console.log(r.data);
                setWebsite(r.data);
            } else {
                setError(r.errors.join(', '));
            }
            setLoading(false);
        }
        fetchSite();
    }, [id]);

    return <>
        <PlyNavbar showLoginPopup={null} />
        {loading ? <Loader /> : null}
        <div className="border-top g-0">
            <div className="p-1">
                <button type="button" className="btn btn-light me-2" onClick={() => { setShowEditCompanyModal(true); } }><i className="bi bi-cursor-text"></i> Business</button>
                <button type="button" className="btn btn-light me-2"><i className="bi bi-cursor-text"></i> Contact</button>
                <button type="button" className="btn btn-light me-2"><i className="bi bi-cursor-text"></i> Phone Numbers</button>
                <button type="button" className="btn btn-light me-2"><i className="bi bi-cursor-text"></i> Social Links</button>
                <button type="button" className="btn btn-light me-2"> Themes</button>
            </div>
        </div>
        {showEditCompanyModal ? <>
            <div className="modal d-block show" id="editCompanyModal" tabIndex="-1" aria-labelledby="editCompanyModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="editCompanyModalLabel">Edit Business Information</h1>
                            <button type="button" className="btn-close" onClick={() => { setShowEditCompanyModal(false); } } aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </> : null}
    </>;

}