import { useState } from 'react';
import '../styles/responsivepreview.css';

const DEVICE_SIZES = {
  mobile: { width: 375, height: "calc(100vh - 120px)" },   // iPhone-like
  //tablet: { width: 768, height: "1024px" },  // iPad-like
  desktop: { width: 1440, height: "900px" }, // common desktop
};

export default function ResponsivePreview({ html }) {
  const [device, setDevice] = useState('mobile');

  const { width, height } = DEVICE_SIZES[device];

  // Scale factor: shrink large devices to fit container
  const scale = device === 'desktop' ? 0.65 : 1; // you can tweak per device

  return (
    <div className="responsive-preview">
      {/* Device Tabs */}
      <div className="device-tabs">
        {Object.keys(DEVICE_SIZES).map((key) => (
          <button
            key={key}
            className={`tab-button ${device === key ? 'active' : ''}`}
            onClick={() => setDevice(key)}
          >
            {key === "mobile" && <i className="bi bi-phone" title="iPhones, Android etc"></i>}
            {key === "tablet" && <i className="bi bi-tablet-landscape" title="Tablets, iPad etc"></i>}
            {key === "desktop" && <i className="bi bi-laptop" title="Laptop, desktops and large screens"></i>}
          </button>
        ))}
      </div>

      {/* Scaled Preview */}
      <div className="iframe-wrapper">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: `${width}px`,
            height: `calc(100vh - 120px)`,
          }}
        >
          <iframe
            title="Responsive Preview"
            srcDoc={html}
            style={{
              width: `${width}px`,
              height: `${height}`,
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              background: 'white',
            }}
          />
        </div>
      </div>
    </div>
  );
}