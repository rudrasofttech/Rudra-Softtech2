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