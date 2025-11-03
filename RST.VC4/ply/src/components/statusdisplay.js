'use client'
export function StatusDisplay({ status }) {
    if (status === 0)
        return <span className="text-success">Active</span>;
    else if (status === 1)
        return <span className="text-secondary">Inactive</span>;
    else if (status === 2)
        return <span className="text-danger">Deleted</span>;
    else if (status === 3)
        return <span className="text-warning">Unverified</span>;
}

export function WebsiteTypeDisplay({ wt }) {
    if (wt === 1)
        return <span>Visiting Card</span>;
    else if (wt === 2)
        return <span>Link List</span>;
    else if (wt === 3)
        return <span>Blog</span>;
    else if (wt === 4)
        return <span>Portfolio</span>;
    else if (wt === 5)
        return <span>E-commerce</span>;
    else if (wt === 6)
        return <span>Educational</span>;
    else if (wt === 7)
        return <span>Portfolio</span>;
    else if (wt === 8)
        return <span>Resume</span>;
}