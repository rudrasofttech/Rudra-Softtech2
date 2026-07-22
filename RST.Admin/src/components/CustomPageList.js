import React, { useState, useEffect, useRef } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import dayjs from 'dayjs';
import pages from '../browser.png';
import deleteicon from '../delete.png';
import editicon from '../edit.png';

export function CustomPageList() {
    const token = localStorage.getItem("token");
    const loggedin = token !== null;

    const [custompages, setCustompages] = useState([]);
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
        fetch(API.GetURL() + `/custompages/list?${params.toString()}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json().then(data => {
                        setCustompages(data.items);
                        setPageCount(data.pageCount);
                        setTotalRecords(data.totalRecords);
                        setBsstyle('');
                        setMessage('');
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

    function handleDeletePage(e) {
        if (window.confirm("Are you sure you want to delete this page?")) {
            fetch(`${API.GetURL()}/custompages/delete/${e}`,
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
                            setCustompages(prev => prev.filter(t => t.id !== data.id));
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

    function renderPostStatus(param) {
        switch (param) {
            case 1:
                return 'Draft';
            case 2:
                return 'Publish';
            case 3:
                return 'Inactive';
            default:
                return '';
        }
    }

    if (!loggedin) {
        return (<Redirect to="/loginform" />);
    }

    return (
        <div>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                <h1 className="h2"><img src={pages} className="img-fluid icon-large me-2" /> Web pages</h1>
                <div className="btn-toolbar mb-2 mb-md-0 gap-2">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search pages…"
                            value={searchInput}
                            onChange={handleSearchChange}
                        />
                        {searchInput && (
                            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleSearchClear}>&times;</button>
                        )}
                    </div>
                    <Link to={'/custompagemanage'} className="btn btn-primary">Create New</Link>
                </div>
            </div>
            <div className="fixedBottom ">
                <MessageStrip message={message} bsstyle={bsstyle} />
            </div>
            {loading ? <Spinner /> : null}
            <Table responsive striped bordered condensed hover>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Date Created</th>
                        <th>Created By</th>
                        <th>Date Modified</th>
                        <th>Modified By</th>
                        <th>Status</th>
                        <th>Sitemap</th>
                        <th colSpan={2}></th>
                    </tr>
                </thead>
                <tbody>
                    {custompages.map(cp =>
                        <tr key={cp.id}>
                            <td>{cp.name}</td>
                            <td>
                                {dayjs(cp.dateCreated).format("DD.MMM.YYYY")}
                            </td>
                            <td>{cp.createdByName}</td>
                            <td>
                                {cp.dateModified !== null ? dayjs(cp.dateModified).format("DD.MMM.YYYY") : null}</td>
                            <td>{cp.modifiedByName}</td>
                            <td>{renderPostStatus(cp.status)}</td>
                            <td>
                                <input type="checkbox" defaultChecked={cp.sitemap} disabled />
                            </td>
                            <td>
                                <Link className='btn btn-link' to={'/custompagemanage/' + cp.id}> <img src={editicon} className="img-fluid icon-extra-small" />
                                </Link></td>
                            <td>
                                <button type='button' className='btn btn-link' onClick={() => { handleDeletePage(cp.id) }}>
                                    <img src={deleteicon} className="img-fluid icon-extra-small" />
                                </button></td>
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
