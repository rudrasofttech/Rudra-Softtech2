import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import { APIURLS } from "../utils/config";
import { getWithAuth } from "../utils/api";
import ExpandableTextarea from "./expandabletextarea";

// Assume getWithAuth and APIURLS are imported or available in scope

function ChooseTheme({
    themeType = 1,
    onThemeSelect,
    initialThemeId = null
}) {
    const [themes, setThemes] = useState({ items: [], pageIndex: 1, pageCount: 1, totalRecords: 0 });
    const [themePageIndex, setThemePageIndex] = useState(1);
    const [loadingTheme, setLoadingTheme] = useState(false);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState(""); // for input box
    const [selectedThemeId, setSelectedThemeId] = useState(initialThemeId);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchThemes() {
            setLoadingTheme(true);
            let url = `${APIURLS.userWebsiteTheme}/?page=${themePageIndex}&wstype=${themeType}`;
            if (search) url += `&k=${encodeURIComponent(search)}`;
            const r = await getWithAuth(url, navigate);
            if (r.result) {
                if (themePageIndex === 1) {
                    setThemes(r.data);
                } else {
                    setThemes((prev) => ({
                        ...r.data,
                        items: [...prev.items, ...r.data.items],
                    }));
                }
            } else {
                toast.error("Failed to load themes: " + r.errors.join(", "));
            }
            setLoadingTheme(false);
        }
        fetchThemes();
        // eslint-disable-next-line
    }, [themePageIndex, themeType, search, navigate]);

    const handleSearchInputChange = (e) => {
        setSearchInput(e.target.value);
    };

    const handleClearButtonClick = () => {
        setSearch("");
        setSearchInput("");
        setThemePageIndex(1);
    };

    const handleSearchButtonClick = () => {
        setSearch(searchInput);
        setThemePageIndex(1);
    };

    const handleThemeClick = (item) => {
        setSelectedThemeId(item.id);
        if (onThemeSelect) onThemeSelect(item.id);
    };

    return (
        <div>
            <div className="mb-2 bg-light p-2 d-flex justify-content-end gap-2">
                <input type="text"  className="form-control mb-2"
                    placeholder="Search themes..."
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    disabled={loadingTheme} />
                    <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={handleSearchButtonClick}
                        disabled={loadingTheme}>
                        Search
                    </button>
                    {!search ? null : <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={handleClearButtonClick}
                        disabled={loadingTheme}>
                        Clear
                    </button>}
            </div>
            <div style={{ overflowY: "auto", height: "calc(100vh - 130px)" }} className="p-3">
                <div className="row">
                    {themes.items.map((item, index) => (
                        <div
                            className="col-4 col-md-4 p-2"
                            key={item.id || index}
                            style={{ height: "300px", overflow: "hidden" }}
                        >
                            <img
                                src={item.thumbnail}
                                className="img-fluid mb-2"
                                alt={item.name}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    objectFit: "cover",
                                    cursor: "pointer",
                                    border: selectedThemeId === item.id ? "8px solid #007bff" : "none",
                                    borderRadius: "10px",
                                }}
                                onClick={() => handleThemeClick(item)}
                            />
                        </div>
                    ))}
                </div>
                {themes.pageIndex < themes.pageCount && (
                    <div className="text-center mt-3">
                        <button
                            className="btn btn-primary"
                            onClick={() => setThemePageIndex((p) => p + 1)}
                            disabled={loadingTheme}
                        >
                            {loadingTheme ? "Loading..." : "Load More"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChooseTheme;