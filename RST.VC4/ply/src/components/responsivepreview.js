import { useState, useRef, useEffect } from 'react';
import '../styles/responsivepreview.css';

const DEVICE_SIZES = {
    mobile: 375,
    tablet: 768,
    desktop: 1280,
};

export default function ResponsivePreview({ html }) {
    const [device, setDevice] = useState('mobile');
    const iframeRef = useRef(null);

    useEffect(() => {
        const doc = iframeRef.current?.contentDocument;
        if (doc && html) {
            doc.open();
            doc.write(html);
            doc.close();
        }
    }, [html, device]);

    return (
        <div className="responsive-preview">
            <div className="device-tabs">
                {Object.keys(DEVICE_SIZES).map((key) => (
                    <button
                        key={key}
                        className={`tab-button ${device === key ? 'active' : ''}`}
                        onClick={() => setDevice(key)}>
                        {key.charAt(0).toUpperCase() + key.slice(1) === "Mobile" ? <i className="bi bi-phone" title="iPhones, Android etc"></i> : null}
                        {key.charAt(0).toUpperCase() + key.slice(1) === "Tablet" ? <i className="bi bi-tablet-landscape" title="Tablets , iPad etc."></i> : null}
                        {key.charAt(0).toUpperCase() + key.slice(1) === "Desktop" ? <i className="bi bi-laptop" title="Laptop, desktops and large screens."></i> : null}
                    </button>
                ))}
            </div>

            <div className="iframe-wrapper">
                <iframe
                    ref={iframeRef}
                    title="Responsive Preview"
                    style={{
                        width: `${DEVICE_SIZES[device]}px`,
                        height: 'calc(100vh - 110px)',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 0 12px rgba(0,0,0,0.1)',
                    }}
                />
            </div>
        </div>
    );
}