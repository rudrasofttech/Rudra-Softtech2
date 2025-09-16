'use client'
export function StatusDisplay({ status }) {
    if (status === 0)
        return "Active";
    else if (status === 1)
        return "Inactive";
    else if (status === 2)
        return "Deleted";
    else if (status === 3)
        return "Unverified";
}

export function WebsiteTypeDisplay({ wt }) {
    if (wt === 1)
        return "Visiting Card";
    else if (wt === 2)
        return "Link List";
    else if (wt === 3)
        return "Blog";
    else if (wt === 4)
        return "Portfolio";
    else if (wt === 5)
        return "E-commerce";
    else if (wt === 6)
        return "Educational";
    else if (wt === 7)
        return "Portfolio";
    else if (wt === 7)
        return "Resume";
}