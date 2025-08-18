'use client'
import { toast } from 'react-toastify';
import useAppStore from '@/store/useAppStore';

export const postWithAuth = async (url, router, payload, options = {}) => {
    const store = useAppStore.getState();
    const { token, expiry, clearToken } = store;
    const { retries = 2, redirectUrl = '/', checkResponseBody = true } = options;

    if (!token || !expiry || Date.now() >= expiry) {
        clearToken();
        toast.warn('Session expired. Please log in again.');
        router.push(redirectUrl);
        //return { result: false, errors: ['Session expired. Please log in again.'] };
        throw new Error('Expired token');
    }

    let attempt = 0;
    while (attempt <= retries) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                if (err.errors) {
                    const messages = Object.entries(err.errors).map(([field, errors]) => `${errors.join(', ')}`);

                    toast.error(`Unable to process request.`);
                    return { result: false, errors: messages }; // array of strings
                }
                return { result: false, errors: [err.error || 'Unexpected error'] }; // single error message
            }

            if (!checkResponseBody)
                return { result: true };

            // Attempt to parse the body
            const data = await res.json();
            //toast.success('Data loaded successfully!');
            return { result: true, data };

        } catch (err) {
            attempt += 1;
            if (attempt > retries) {
                toast.error(`Request failed: ${err.message}`);
                return { result: false, errors: [err.message] };
                //throw err;
            }
            toast.info(`Retrying… (${attempt})`);
            await new Promise(r => setTimeout(r, attempt * 500)); // backoff
        }
    }
};

export const getWithAuth = async (url, router, options = {}) => {
    const { retries = 2, redirectUrl = '/', checkResponseBody = true } = options;

    const store = useAppStore.getState();
    const { token, expiry, clearToken } = store;

    if (!token || !expiry || Date.now() >= expiry) {
        clearToken();
        toast.warn('Session expired. Please log in again.');
        router.push(redirectUrl);
        throw new Error('Token expired');
    }

    let attempt = 0;
    while (attempt <= retries) {
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                const err = await res.json();

                return { result: false, errors: [err.error || 'Unexpected error'] }; // single error message
                //throw new Error(err.error || 'Unexpected error');
            }
            if (!checkResponseBody)
                return { result: true };
            const data = await res.json();
            //toast.success('Data loaded successfully!');
            return { result: true, data };
        } catch (err) {
            attempt += 1;
            if (attempt > retries) {
                toast.error(`Fetch failed: ${err.message}`);
                return { result: false, errors: [err.message] };
                //throw err;
            }
            toast.info(`Retrying… (${attempt})`);
            await new Promise(r => setTimeout(r, attempt * 500));
        }
    }
};