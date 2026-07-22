import React, { useState, useEffect, useRef } from 'react';
import { Link, Redirect } from 'react-router-dom';
import dayjs from 'dayjs';
import { Table } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import articles from '../article.png';
import deleteicon from '../delete.png';
import editicon from '../edit.png';

export function ArticleList() {
    const token = localStorage.getItem("token");
    const loggedin = token !== null;

    const [articleList, setArticleList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bsstyle, setBsstyle] = useState('');
    const [message, setMessage] = useState('');
    const [pageIndex, setPageIndex] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const debounceRef = useRef(null);

    useEffect(() => {
        fetchData(pageIndex, keyword);
    }, [pageIndex, keyword]);

    function handleSearchChange(e) {
        const val = e.target.value;
        setSearchInput(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPageIndex(1);
            setKeyword(val.trim());
        }, 400);
    }

    function handleSearchClear() {
        setSearchInput('');
        setKeyword('');
        setPageIndex(1);
    }

    function fetchData(page, kw) {
        setLoading(true);
        setBsstyle('');
        setMessage('');
        const params = new URLSearchParams({ p: page, ps: 10 });
        if (kw) params.append('q', kw);
        fetch(API.GetURL() + `/posts?${params.toString()}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json().then(data => {
                        setArticleList(data.items);
                        setPageCount(data.pageCount);
                        setTotalRecords(data.totalRecords);
                    });
                } else {
                    response.json().then(data => {
                        setBsstyle('danger');
                        setMessage(data.error);
                    }).catch(() => {
                        setBsstyle('danger');
                        setMessage("Unable to process request.");
                    });
                }
            }).catch(() => {
                setBsstyle('danger');
                setMessage("Unable to contact server.");
            }).finally(() => {
                setLoading(false);
            });
    }

    function handleDeleteArticle(e) {
        if (window.confirm("Are you sure you want to delete this article?")) {
            setLoading(true);
            setBsstyle('');
            setMessage('');
            fetch(`${API.GetURL()}/posts/remove/${e}`,
                {
                    method: 'get',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => {
                    if (response.status === 200) {
                        response.json().then(data => {
                            setArticleList(prev => prev.filter(t => t.id !== data.id));
                        });
                    } else {
                        response.json().then(data => {
                            setBsstyle('danger');
                            setMessage(data.error);
                        }).catch(() => {
                            setBsstyle('danger');
                            setMessage("Unable to process request.");
                        });
                    }
                }).catch(() => {
                    setBsstyle('danger');
                    setMessage("Unable to contact server.");
                }).finally(() => {
                    setLoading(false);
                });
        }
    }

    if (!loggedin) {
        return (<Redirect to="/loginform" />);
    }

    return (
        <div>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                <h1 className="h2"><img src={articles} className="img-fluid icon-large me-2" /> Articles</h1>
                <div className="btn-toolbar mb-2 mb-md-0 gap-2">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search articles…"
                            value={searchInput}
                            onChange={handleSearchChange}
                        />
                        {searchInput && (
                            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleSearchClear}>&times;</button>
                        )}
                    </div>
                    <Link to={'/articlemanage'} className="btn btn-primary">Create New</Link>
                </div>
            </div>
            <div className="fixedBottom ">
                <MessageStrip message={message} bsstyle={bsstyle} />
            </div>
            {loading ? <Spinner /> : null}
            <Table responsive striped bordered condensed hover>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Date Created</th>
                        <th>Created By</th>
                        <th>Date Modified</th>
                        <th>Modified By</th>
                        <th>Status</th>
                        <th colSpan="2"></th>
                    </tr>
                </thead>
                <tbody>
                    {articleList.map(cp =>
                        <tr key={cp.id}>
                            <td>{cp.title}</td>
                            <td>{dayjs(cp.dateCreated).format("DD.MMM.YYYY")}</td>
                            <td>{cp.createdByName}</td>
                            <td>{cp.dateModified !== null ? dayjs(cp.dateModified).format("DD.MMM.YYYY") : null}</td>
                            <td>{cp.modifiedByName}</td>
                            <td>{cp.status}</td>
                            <td>
                                <Link className='btn btn-link' to={`/articlemanage/${cp.id}`}>
                                    <img src={editicon} className="img-fluid icon-extra-small" />
                                </Link>
                            </td>
                            <td>
                                <button type='button' className='btn btn-link' onClick={() => { handleDeleteArticle(cp.id) }}>
                                    <img src={deleteicon} className="img-fluid icon-extra-small" />
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
            {pageCount > 1 && (
                <nav>
                    <ul className="pagination">
                        <li className={`page-item${pageIndex === 1 ? ' disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPageIndex(p => p - 1)} disabled={pageIndex === 1}>Previous</button>
                        </li>
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                            <li key={p} className={`page-item${p === pageIndex ? ' active' : ''}`}>
                                <button className="page-link" onClick={() => setPageIndex(p)}>{p}</button>
                            </li>
                        ))}
                        <li className={`page-item${pageIndex === pageCount ? ' disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPageIndex(p => p + 1)} disabled={pageIndex === pageCount}>Next</button>
                        </li>
                    </ul>
                </nav>
            )}
            <small className="text-muted">{totalRecords} total records</small>
        </div>
    );
}
