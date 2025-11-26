'use client'
export function StatusDisplay({ status }) {
    if (status === 0)
        return (
            <span className="text-success" title="Active">
                <i className="bi bi-check-circle-fill me-1"></i>
            </span>
        );
    else if (status === 1)
        return (
            <span className="text-secondary" title="Inactive">
                <i className="bi bi-x-circle-fill me-1"></i>
            </span>
        );
    else if (status === 2)
        return (
            <span className="text-danger" title="Deleted">
                <i className="bi bi-trash-fill me-1"></i>
            </span>
        );
    else if (status === 3)
        return (
            <span className="text-warning" title="Unverified">
                <i className="bi bi-exclamation-circle-fill me-1"></i>
            </span>
        );
    else
        return null;
}

export function WebsiteTypeDisplay({ wt }) {
    if (wt === 1)
        return (
            <span title="Visiting Card" className="icon">
                💼
                {/* Optionally, you can remove the text below */}
                {/* Visiting Card */}
            </span>
        );
    else if (wt === 2)
        return (
            <span className="icon">🔗</span>
        );
    else if (wt === 3)
        return <span title="Blog"><i className="bi bi-journal-text me-1"></i></span>;
    else if (wt === 4)
        return <span title="Portfolio"><i className="bi bi-briefcase-fill me-1"></i></span>;
    else if (wt === 5)
        return <span title="E-commerce"><i className="bi bi-cart-fill me-1"></i></span>;
    else if (wt === 6)
        return <span title="Educational"><i className="bi bi-mortarboard-fill me-1"></i></span>;
    else if (wt === 7)
        return <span title="Portfolio"><i className="bi bi-briefcase-fill me-1"></i></span>;
    else if (wt === 8)
        return <span title="Resume"><i className="bi bi-file-earmark-person-fill me-1"></i></span>;
    else
        return null;
}