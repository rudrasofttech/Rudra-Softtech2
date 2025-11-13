import "../styles/home.css";

export default function HomeAnonymous({ onStart }) {
    return (
        <>
            {/* Hero Section */}
            <section className="text-center py-5 px-4">
                <h1 className="display-5 fw-bold">
                    All Your Essential Links & Documents,<br />Crafted Beautifully, Instantly Shared.
                </h1>
                <p className="lead mt-3">
                    Create digital visiting cards, link lists, resumes, documents, and spreadsheets in one powerful, easy-to-use platform.
                </p>
                <button type="button" onClick={onStart} className="btn btn-primary btn-lg mt-3 cta-button">
                    🚀 Start Creating — It's Free!
                </button>
            </section>

            {/* Features */}
            <section className="container py-5">
                <h2 className="text-center mb-4">What You Can Build</h2>
                <div className="row text-center">
                    <div className="col-md-3 mb-4">
                        <div className="feature-icon text-primary fs-1"><i className="bi bi-person-vcard-fill"></i></div>
                        <p className="fw-semibold fs-4">Digital Visiting Cards</p>
                    </div>
                    <div className="col-md-3 mb-4">
                        <div className="feature-icon text-warning fs-1"><i className="bi bi-link-45deg"></i></div>
                        <p className="fw-semibold fs-4">All-in-One Link Lists</p>
                    </div>
                    <div className="col-md-3 mb-4">
                        <div className="feature-icon text-danger fs-1">
                            <i className="bi bi-file-earmark-richtext-fill"></i>
                        </div>
                        <p className="fw-semibold fs-4">Professional Resumes & CVs</p>
                    </div>
                    <div className="col-md-3 mb-4">
                        <div className="feature-icon text-primary fs-1"><i className="bi bi-file-spreadsheet"></i></div>
                        <p className="fw-semibold fs-4">Sleek Documents & Spreadsheets</p>
                    </div>
                </div>
            </section>

            {/* Template Showcase */}
            <section className="bg-light py-5">
                <div className="container text-center">
                    <h2 className="mb-4">Start Ahead: Choose from many of Designer Templates</h2>
                    <div className="row g-4">
                        <div className="col-md-3">
                            <div className="w-100" style={{ height: "400px", overflowY: "hidden" }}>
                                <img src="https://www.rudrasofttech.com/drive/ply-home/dailymart.jpg"
                                    alt="Link List" className="img-fluid" />
                            </div>
                            <div className="p-3 bg-white border rounded">
                                <a className="text-dark text-decoration-none text-uppercase" href="https://dailymart.vc4.in/">dailymart.vc4.in</a>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="w-100" style={{ height: "400px", overflowY: "hidden" }}>
                                <img src="https://www.rudrasofttech.com/drive/ply-home/lexlogic.jpg"
                                    alt="Link List" className="img-fluid" />
                            </div>
                            <div className="p-3 bg-white border rounded">
                                <a className="text-dark text-decoration-none text-uppercase" href="https://lexlogic.vc4.in/">lexlogic.vc4.in</a>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="w-100" style={{ height: "400px", overflowY: "hidden" }}>
                                <img src="https://www.rudrasofttech.com/drive/ply-home/aarunyaglow.jpg"
                                    alt="Link List" className="img-fluid" />
                            </div>
                            <div className="p-3 bg-white border rounded">
                                <a className="text-dark text-decoration-none text-uppercase" href="https://aarunyaglow.vc4.in/">aarunyaglow.vc4.in</a>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="w-100" style={{ height: "400px", overflowY: "hidden" }}>
                                <img src="https://www.rudrasofttech.com/drive/ply-home/smilecraft.jpg"
                                    alt="Link List" className="img-fluid" />
                            </div>
                            <div className="p-3 bg-white border rounded">
                                <a className="text-dark text-decoration-none text-uppercase" href="https://smilecraft.vc4.in/">smilecraft.vc4.in</a>
                            </div>
                        </div>
                    </div>
                    {/* <a href="#" className="btn btn-outline-primary mt-4">Explore All Templates</a> */}
                </div>
            </section>

            {/* Why Choose Ply */}
            <section className="container py-5">
                <div className="row">
                    <div className="col-md-6">
                        <h2 className="text-center mb-4">Why Choose Ply?</h2>

                        <div className="mb-4 text-center d-flex align-items-center justify-content-center">
                            <span className="feature-icon">🖱️</span>
                            <div className="fw-semibold fs-4">Drag-and-Drop Simplicity</div>
                        </div>
                        <div className="mb-4 text-center d-flex align-items-center justify-content-center">
                            <span className="feature-icon">📱</span>
                            <div className="fw-semibold fs-4">Cross-Platform Sharing</div>
                        </div>
                        <div className="mb-4 text-center d-flex align-items-center justify-content-center">
                            <span className="feature-icon">🤝</span>
                            <div className="fw-semibold fs-4">Real-Time Collaboration</div>
                        </div>
                        <div className="mb-4 text-center d-flex align-items-center justify-content-center">
                            <span className="feature-icon">📈</span>
                            <div className="fw-semibold fs-4">Advanced Analytics</div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="container text-center">
                            <h2 className="mb-4">Loved by Creators, Professionals, and Businesses</h2>
                            <div className="testimonial mb-4">
                                “Ply is a game-changer. My clients always comment on how professional my digital card looks.” — Sarah K., Freelance Designer
                            </div>
                            <div className="testimonial">
                                “We replaced multiple tools with Ply. It's incredibly fast to update our team's contact info.” — Mark J., Small Business Owner
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-white text-center py-5 border-top">
                <h2 className="mb-3">Stop Juggling Tools. Start Creating Effortlessly.</h2>
                <button type="button" onClick={onStart} className="btn btn-warning btn-lg cta-button">
                    🚀 Start Creating Your First Project Today
                </button>
                <p className="mt-3">
                    ✅ 100% Free to Start | ✅ No Credit Card Required | ✅ Easy Sign-Up
                </p>
            </footer>
        </>
    );
}