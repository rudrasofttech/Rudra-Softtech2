import { useState, useRef, useEffect } from 'react';
import '../styles/responsivepreview.css';

const DEVICE_SIZES = {
    mobile: 375,
    //tablet: 768,
    //desktop: 1920,
};

export default function ResponsivePreview({ html }) {
    const [device, setDevice] = useState('mobile');
    const iframeRef = useRef(null);
    const handleIframeLoad = () => {
        if (device === 'desktop' && iframeRef.current) {
            const iframe = iframeRef.current;
            if (iframe && iframe.parentElement) {
                const parent = iframe.parentElement;
                parent.scrollLeft = (iframe.scrollWidth - parent.clientWidth) / 2;
            }
        }
    };

    useEffect(() => {
        const doc = iframeRef.current?.contentDocument;
        if (doc && html) {
            let processedHtml = html;
            // Remove all viewport meta tags
            processedHtml = processedHtml.replace(/<meta[^>]*name=["']viewport["'][^>]*>/gi, '');
            if (device === 'desktop') {
                // Inject viewport meta tag for desktop width
                processedHtml = processedHtml.replace(
                    /<head(.*?)>/i,
                    `<head$1>`
                );
                // Inject style to set body width
                const desktopBodyStyle = `<style>body { width: ${DEVICE_SIZES['desktop']}px !important; margin: 0 auto !important; }</style>`;
                processedHtml = processedHtml.replace(/<head(.*?)>/i, `<head$1>${desktopBodyStyle}`);
            } else {
                // Inject responsive viewport meta tag for mobile/tablet
                processedHtml = processedHtml.replace(
                    /<head(.*?)>/i,
                    '<head$1><meta name="viewport" content="width=device-width, initial-scale=1">'
                );
            }
            doc.open();
            doc.write(processedHtml);
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
                    onLoad={handleIframeLoad}
                    style={
                        device === 'desktop'
                            ? {
                                  width: `${DEVICE_SIZES['desktop']}px`,
                                  height: 'calc(100vh - 90px)',
                                  border: '1px solid #ccc',
                                  borderRadius: '8px',
                                  boxShadow: '0 0 12px rgba(0,0,0,0.1)',
                              }
                            : {
                                  width: `${DEVICE_SIZES[device]}px`,
                                  height: 'calc(100vh - 110px)',
                                  border: '1px solid #ccc',
                                  borderRadius: '8px',
                                  boxShadow: '0 0 12px rgba(0,0,0,0.1)',
                              }
                    }
                />
            </div>
        </div>
    );
}