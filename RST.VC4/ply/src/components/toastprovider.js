'use client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ToastProvider() {
    return (
        <ToastContainer
            position="bottom-right"
            autoClose={2000}
            theme="light"
            hideProgressBar={true}
            newestOnTop
            closeOnClick
            pauseOnHover
        />
    );
}
