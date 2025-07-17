import React from 'react';

const Loader = ({
    text = '',
    position = 'fixed',
    top = '50%',
    left = '50%',
    radius = 30,
    stroke = 4,
    progressColor = '#0d6efd',
    bgColor = '#e9ecef',
    glow = true
}) => {
    const containerStyle = {
        position,
        top,
        left,
        transform: 'translate(-50%, -50%)',
        zIndex: 1050,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
    };

    const circleSize = radius * 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <div style={containerStyle}>
            <svg
                width={circleSize}
                height={circleSize}
                viewBox={`0 0 ${circleSize} ${circleSize}`}
                className="spinner-border"
            >
                {/* Glowing shadow */}
                {glow && (
                    <circle
                        cx={radius}
                        cy={radius}
                        r={radius - stroke}
                        fill="none"
                        stroke={progressColor}
                        strokeWidth={stroke}
                        opacity="0.2"
                        style={{ filter: 'url(#glow)' }}
                    />
                )}

                {/* Background ring */}
                <circle
                    cx={radius}
                    cy={radius}
                    r={radius - stroke - 1}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={stroke}
                />

                {/* Foreground ring */}
                <circle
                    cx={radius}
                    cy={radius}
                    r={radius - stroke / 2}
                    fill="none"
                    stroke={progressColor}
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * 0.75}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${radius} ${radius})`}
                />

                {/* Filter for glow */}
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>
            {text && <div className="mt-3 text-muted">{text}</div>}
        </div>
    );
};

export default Loader;