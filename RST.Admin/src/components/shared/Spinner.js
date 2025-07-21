import React from 'react';
export default function Spinner(props) {
    return <div className="p-3 bg-white rounded-2 text-center" style={{ position: "fixed", minHeight: "100px", minWidth: "100px", top: "50%", marginTop: "-50px", left: "50%", marginLeft: "-50px", zIndex: 1000 }}>
        <div className="spinner-border text-primary mt-3" role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
        {props.text !== undefined && props.text !== null && props.text !== "" ? <div>{props.text}</div> : null}
    </div>;
}