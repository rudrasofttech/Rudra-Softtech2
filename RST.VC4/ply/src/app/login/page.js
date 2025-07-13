'use client'

import React, { useEffect, useRef } from 'react';

export default function Login() {
    const popupRef = useRef(null);

    const openLoginPopup = () => {
        popupRef.current = window.open(
            'https://www.rudrasofttech.com/account/login?redirectUrl=',
            'LoginWindow',
            'width=500,height=600'
        );
    };

    useEffect(() => {
        const handleMessage = (event) => {
            // Replace with your IdP origin
            if (event.origin !== 'https://www.rudrasofttech.com') return;
            
            
            console.log('Message received from IdP:', event.data);
            if (event.data !== null && event.data !== undefined) {
                console.log('Token received:', event.data.t);
                

                if (popupRef.current) {
                    popupRef.current.close();
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div>
            <button onClick={openLoginPopup}>Login with SSO</button>
        </div>
    );
};