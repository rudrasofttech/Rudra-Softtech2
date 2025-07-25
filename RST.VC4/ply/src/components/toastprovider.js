﻿'use client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ToastProvider() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={3000}
            theme="light"
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
        />
    );
}
