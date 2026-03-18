import React, { useState } from 'react';
import ExpandableTextarea from './expandabletextarea';

const steps = [
  {
    label: 'Basic Information',
    fields: ['name', 'tagline', 'about']
  },
  {
    label: 'Services / Products',
    fields: ['services']
  },
  {
    label: 'Testimonials',
    fields: ['testimonials']
  },
  {
    label: 'Contact Information',
    fields: ['email', 'phone', 'address', 'social']
  },
  {
    label: 'Design Preferences',
    fields: ['colorHint', 'primaryColor', 'secondaryColor', 'backgroundStyle', 'headingFont', 'bodyFont', 'layoutStyle']
  },
  {
    label: 'Branding',
    fields: ['logoOption', 'faviconOption']
  },
  {
    label: 'Images & Media',
    fields: ['heroBanner', 'serviceVisuals']
  },
  {
    label: 'Typography Hierarchy',
    fields: ['headingStyle', 'bodyTextStyle']
  },
  {
    label: 'Sections to Include',
    fields: ['sections', 'ctaText']
  },
  {
    label: 'Animations & Interactivity',
    fields: ['stickyNav', 'heroAnim', 'sectionAnim', 'hoverEffects']
  },
  {
    label: 'SEO & Metadata',
    fields: ['pageTitle', 'metaDesc', 'keywords', 'socialMeta']
  },
  {
    label: 'Footer',
    fields: ['quickLinks', 'copyright']
  }
];

const colorHints = ['earthy', 'bright', 'pastel', 'dark', 'cheerful', 'elegant'];
const backgroundStyles = ['solid', 'gradient', 'image'];
const layoutStyles = ['minimalist', 'professional', 'creative', 'bold'];
const logoOptions = ['upload', 'ai'];
const faviconOptions = ['match', 'placeholder'];
const heroBanners = ['nature', 'office', 'product', 'portfolio'];
const serviceVisuals = ['icons', 'photos', 'none'];
const headingStyles = ['bold', 'subtle'];

export default function WebsiteFormWizard({ onSubmit }) {
  const [form, setForm] = useState({
    name: '', tagline: '', about: '',
    services: [{ name: '', description: '', image: '' }],
    testimonials: '',
    email: '', phone: '', address: '', social: '',
    colorHint: '', primaryColor: '', secondaryColor: '', backgroundStyle: '', headingFont: '', bodyFont: '', layoutStyle: '',
    logoOption: '', faviconOption: '',
    heroBanner: '', serviceVisuals: '',
    headingStyle: '', bodyTextStyle: '',
    sections: { hero: true, about: true, services: true, testimonials: false, contact: true, footer: true },
    ctaText: '',
    stickyNav: false, heroAnim: false, sectionAnim: false, hoverEffects: false,
    pageTitle: '', metaDesc: '', keywords: '', socialMeta: '',
    quickLinks: '', copyright: ''
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('section-')) {
      setForm(f => ({ ...f, sections: { ...f.sections, [name.replace('section-', '')]: checked } }));
    } else if (name.startsWith('service-')) {
      const [, idx, field] = name.split('-');
      setForm(f => {
        const services = f.services.map((s, i) => i === +idx ? { ...s, [field]: value } : s);
        return { ...f, services };
      });
    } else {
      setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  }
  function addService() {
    setForm(f => ({ ...f, services: [...f.services, { name: '', description: '', image: '' }] }));
  }
  function validate(currentStep = step) {
    const errs = {};
    const s = steps[currentStep];
    if (!s) return errs;
    for (const field of s.fields) {
      if (field === 'services') {
        form.services.forEach((serv, i) => {
          if (!serv.name.trim()) errs[`service-name-${i}`] = 'Required';
          if (!serv.description.trim()) errs[`service-description-${i}`] = 'Required';
        });
      } else if (field === 'name' && !form.name.trim()) errs.name = 'Required';
      else if (field === 'about' && !form.about.trim()) errs.about = 'Required';
      else if (field === 'email' && !form.email.trim()) errs.email = 'Required';
      else if (field === 'headingFont' && !form.headingFont.trim()) errs.headingFont = 'Required';
      else if (field === 'bodyFont' && !form.bodyFont.trim()) errs.bodyFont = 'Required';
      else if (field === 'pageTitle' && !form.pageTitle.trim()) errs.pageTitle = 'Required';
      else if (field === 'metaDesc' && !form.metaDesc.trim()) errs.metaDesc = 'Required';
      else if (field === 'copyright' && !form.copyright.trim()) errs.copyright = 'Required';
    }
    return errs;
  }
  function handleNext(e) {
    e && e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(s => s + 1);
  }
  function handlePrev(e) {
    e && e.preventDefault();
    setStep(s => Math.max(0, s - 1));
  }
  function formatPrompt(form) {
    // Helper for (none provided)
    const np = v => v && v.trim() ? v : '(none provided)';
    // Services/Products
    const services = form.services && form.services.length
      ? form.services.map(s => `   - Name: ${np(s.name)}\n     Description: ${np(s.description)}\n     Image/Icon: ${np(s.image)}`).join('\n')
      : '(none provided)';
    // Sections to Include
    const sectionList = [
      form.sections.hero && `Hero Banner (company name + tagline + CTA button [${np(form.ctaText)}])`,
      form.sections.about && 'About Us',
      form.sections.services && 'Services/Products',
      form.sections.testimonials && 'Testimonials',
      form.sections.contact && 'Contact Form (fields: name, email, message; behavior: send emails)',
      form.sections.footer && `Footer (quick navigation links: ${np(form.quickLinks)}; copyright: ${np(form.copyright)})`
    ].filter(Boolean).join('\n   - ');
    // Animations & Interactivity
    const bool = v => v ? 'true' : 'false';
    // Prompt text
    return `Create a modern, responsive single-page website based on the following details:\n\n1. **Business/Person Name**: ${np(form.name)}\n2. **Tagline/Slogan**: ${np(form.tagline)}\n3. **About Section**: ${np(form.about)}\n\n4. **Services/Products**:\n${services}\n\n5. **Testimonials**: ${np(form.testimonials)}\n\n6. **Contact Information**:\n   - Email: ${np(form.email)}\n   - Phone: ${np(form.phone)}\n   - Address: ${np(form.address)}\n   - Social Media Links: ${np(form.social)}\n\n7. **Design Preferences**:\n   - Color Preference Hint: ${np(form.colorHint)}\n   - Primary Color: ${np(form.primaryColor)}\n   - Secondary Color: ${np(form.secondaryColor)}\n   - Background Style: ${np(form.backgroundStyle)}\n   - Fonts: Headings in ${np(form.headingFont)}, body text in ${np(form.bodyFont)}\n   - Layout Style: ${np(form.layoutStyle)}\n\n8. **Branding**:\n   - Logo: ${form.logoOption === 'ai' ? 'AI placeholder' : form.logoOption === 'upload' ? 'upload' : '(none provided)'}\n   - Favicon: ${form.faviconOption === 'match' ? 'match logo' : form.faviconOption === 'placeholder' ? 'placeholder' : '(none provided)'}\n\n9. **Images & Media**:\n   - Hero Banner: ${np(form.heroBanner)}\n   - Service Sections: ${np(form.serviceVisuals)}\n\n10. **Typography Hierarchy**:\n   - Headings: ${np(form.headingStyle)}\n   - Body Text: ${np(form.bodyTextStyle)}\n\n11. **Sections to Include**:\n   - ${sectionList}\n\n12. **Animations & Interactivity**:\n   - Sticky navigation bar: ${bool(form.stickyNav)}\n   - Hero text animation: ${bool(form.heroAnim)}\n   - Section animations: ${bool(form.sectionAnim)}\n   - Hover effects: ${bool(form.hoverEffects)}\n\n13. **SEO & Metadata**:\n   - Page Title: ${np(form.pageTitle)}\n   - Meta Description: ${np(form.metaDesc)}\n   - Keywords: ${np(form.keywords)}\n   - OpenGraph/Twitter metadata: ${np(form.socialMeta)}\n\n---\n\n### 🔒 Mandatory Instructions\n- Generate clean, semantic HTML, CSS, and JavaScript.  \n- Ensure the site is **fully responsive** for mobile, tablet, and desktop using modern web standards (flexbox/grid, responsive units).  \n- Generate its own CSS within <style> tags or a linked stylesheet. Do **not** rely on external frameworks unless explicitly requested.  \n- Mark each major section with a **unique class name** and a 'data-section' attribute (e.g., <section class="services" data-section="services">). Use consistent naming for: hero, about, services, products, testimonials, contact, footer.  \n- Include accessibility features (alt text for images, labeled form fields, readable contrast).  \n- Use consistent spacing, typography hierarchy, and color scheme based on user inputs.  \n- Include smooth scrolling, hover effects, and optional animations as specified.  `;
  }
  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(step);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      const prompt = formatPrompt(form);
      if (onSubmit) onSubmit(prompt, form);
      else console.log(prompt);
    }
  }
  const err = key => errors[key] && <span className="text-danger ms-2" style={{ fontSize: 12 }}>{errors[key]}</span>;

  // Render fields for the current step
  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="mb-4">
            <div className="mb-3">
              <label className="form-label">Business/Person Name*{err('name')}
                <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
              </label>
            </div>
            <div className="mb-3">
              <label className="form-label">Tagline/Slogan
                <input className="form-control" name="tagline" value={form.tagline} onChange={handleChange} />
              </label>
            </div>
            <div className="mb-3">
              <label className="form-label">About*{err('about')}
                <ExpandableTextarea className="form-control" name="about" value={form.about} onChange={handleChange} required style={{ width: '100%' }} />
              </label>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="mb-4">
            {form.services.map((s, i) => (
              <div key={i} className="border rounded p-3 mb-3 bg-light-subtle">
                <label className="form-label">Name*{err(`service-name-${i}`)}
                  <input className="form-control" name={`service-${i}-name`} value={s.name} onChange={handleChange} required />
                </label>
                <label className="form-label mt-2">Description*{err(`service-description-${i}`)}
                  <ExpandableTextarea className="form-control" name={`service-${i}-description`} value={s.description} onChange={handleChange} required style={{ width: '100%' }} />
                </label>
                <label className="form-label mt-2">Image/Icon URL
                  <input className="form-control" name={`service-${i}-image`} value={s.image} onChange={handleChange} />
                </label>
              </div>
            ))}
            <button type="button" className="btn btn-outline-primary" onClick={addService}>+ Add Service/Product</button>
          </div>
        );
      case 2:
        return (
          <div className="mb-4">
            <label className="form-label">Testimonials
              <ExpandableTextarea className="form-control" name="testimonials" value={form.testimonials} onChange={handleChange} style={{ width: '100%' }} />
            </label>
          </div>
        );
      case 3:
        return (
          <div className="mb-4">
            <label className="form-label">Email*{err('email')}
              <input className="form-control" name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label className="form-label mt-2">Phone
              <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
            </label>
            <label className="form-label mt-2">Address
              <input className="form-control" name="address" value={form.address} onChange={handleChange} />
            </label>
            <label className="form-label mt-2">Social Media Links
              <ExpandableTextarea className="form-control" name="social" value={form.social} onChange={handleChange} style={{ width: '100%' }} />
            </label>
          </div>
        );
      case 4:
        return (
          <div className="mb-4">
            <label className="form-label">Color Preference Hint
              <select className="form-select" name="colorHint" value={form.colorHint} onChange={handleChange}>
                <option value="">Select</option>
                {colorHints.map(opt => <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>)}
              </select>
            </label>
            <label className="form-label mt-2">Primary Color (hex)
              <input className="form-control" name="primaryColor" value={form.primaryColor} onChange={handleChange} placeholder="#123456" />
            </label>
            <label className="form-label mt-2">Secondary Color (hex)
              <input className="form-control" name="secondaryColor" value={form.secondaryColor} onChange={handleChange} placeholder="#abcdef" />
            </label>
            <label className="form-label mt-2">Background Style
              <select className="form-select" name="backgroundStyle" value={form.backgroundStyle} onChange={handleChange}>
                <option value="">Select</option>
                {backgroundStyles.map(opt => <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>)}
              </select>
            </label>
            <label className="form-label mt-2">Heading Font*{err('headingFont')}
              <input className="form-control" name="headingFont" value={form.headingFont} onChange={handleChange} required />
            </label>
            <label className="form-label mt-2">Body Font*{err('bodyFont')}
              <input className="form-control" name="bodyFont" value={form.bodyFont} onChange={handleChange} required />
            </label>
            <label className="form-label mt-2">Layout Style
              <select className="form-select" name="layoutStyle" value={form.layoutStyle} onChange={handleChange}>
                <option value="">Select</option>
                {layoutStyles.map(opt => <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>)}
              </select>
            </label>
          </div>
        );
      case 5:
        return (
          <div className="mb-4">
            <label className="form-label">Logo Option
              <select className="form-select" name="logoOption" value={form.logoOption} onChange={handleChange}>
                <option value="">Select</option>
                {logoOptions.map(opt => <option key={opt} value={opt}>{opt === 'ai' ? 'AI Placeholder' : 'Upload'}</option>)}
              </select>
            </label>
            <label className="form-label mt-2">Favicon Option
              <select className="form-select" name="faviconOption" value={form.faviconOption} onChange={handleChange}>
                <option value="">Select</option>
                {faviconOptions.map(opt => <option key={opt} value={opt}>{opt === 'match' ? 'Match Logo' : 'Placeholder'}</option>)}
              </select>
            </label>
          </div>
        );
      case 6:
        return (
          <div className="mb-4">
            <label className="form-label">Hero Banner Image Preference
              <select className="form-select" name="heroBanner" value={form.heroBanner} onChange={handleChange}>
                <option value="">Select</option>
                {heroBanners.map(opt => <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>)}
              </select>
            </label>
            <label className="form-label mt-2">Service Section Visuals
              <select className="form-select" name="serviceVisuals" value={form.serviceVisuals} onChange={handleChange}>
                <option value="">Select</option>
                {serviceVisuals.map(opt => <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>)}
              </select>
            </label>
          </div>
        );
      case 7:
        return (
          <div className="mb-4">
            <label className="form-label">Heading Style
              <select className="form-select" name="headingStyle" value={form.headingStyle} onChange={handleChange}>
                <option value="">Select</option>
                {headingStyles.map(opt => <option key={opt} value={opt}>{opt === 'bold' ? 'Bold/Uppercase' : 'Subtle'}</option>)}
              </select>
            </label>
            <label className="form-label mt-2">Body Text Style
              <input className="form-control" name="bodyTextStyle" value={form.bodyTextStyle} onChange={handleChange} />
            </label>
          </div>
        );
      case 8:
        return (
          <div className="mb-4">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="section-hero" checked={form.sections.hero} onChange={handleChange} id="section-hero" />
              <label className="form-check-label" htmlFor="section-hero">Hero Banner</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="section-about" checked={form.sections.about} onChange={handleChange} id="section-about" />
              <label className="form-check-label" htmlFor="section-about">About Us</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="section-services" checked={form.sections.services} onChange={handleChange} id="section-services" />
              <label className="form-check-label" htmlFor="section-services">Services/Products</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="section-testimonials" checked={form.sections.testimonials} onChange={handleChange} id="section-testimonials" />
              <label className="form-check-label" htmlFor="section-testimonials">Testimonials</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="section-contact" checked={form.sections.contact} onChange={handleChange} id="section-contact" />
              <label className="form-check-label" htmlFor="section-contact">Contact Form</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="section-footer" checked={form.sections.footer} onChange={handleChange} id="section-footer" />
              <label className="form-check-label" htmlFor="section-footer">Footer</label>
            </div>
            <label className="form-label mt-2">CTA Button Text
              <input className="form-control" name="ctaText" value={form.ctaText} onChange={handleChange} />
            </label>
          </div>
        );
      case 9:
        return (
          <div className="mb-4">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="stickyNav" checked={form.stickyNav} onChange={handleChange} id="stickyNav" />
              <label className="form-check-label" htmlFor="stickyNav">Sticky Navigation Bar</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="heroAnim" checked={form.heroAnim} onChange={handleChange} id="heroAnim" />
              <label className="form-check-label" htmlFor="heroAnim">Hero Text Animation</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="sectionAnim" checked={form.sectionAnim} onChange={handleChange} id="sectionAnim" />
              <label className="form-check-label" htmlFor="sectionAnim">Section Animations</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="hoverEffects" checked={form.hoverEffects} onChange={handleChange} id="hoverEffects" />
              <label className="form-check-label" htmlFor="hoverEffects">Hover Effects</label>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="mb-4">
            <label className="form-label">Page Title*{err('pageTitle')}
              <input className="form-control" name="pageTitle" value={form.pageTitle} onChange={handleChange} required />
            </label>
            <label className="form-label mt-2">Meta Description*{err('metaDesc')}
              <ExpandableTextarea className="form-control" name="metaDesc" value={form.metaDesc} onChange={handleChange} required style={{ width: '100%' }} />
            </label>
            <label className="form-label mt-2">Keywords
              <ExpandableTextarea className="form-control" name="keywords" value={form.keywords} onChange={handleChange} style={{ width: '100%' }} />
            </label>
            <label className="form-label mt-2">Social Metadata
              <ExpandableTextarea className="form-control" name="socialMeta" value={form.socialMeta} onChange={handleChange} style={{ width: '100%' }} />
            </label>
          </div>
        );
      case 11:
        return (
          <div className="mb-4">
            <label className="form-label">Quick Navigation Links
              <ExpandableTextarea className="form-control" name="quickLinks" value={form.quickLinks} onChange={handleChange} style={{ width: '100%' }} />
            </label>
            <label className="form-label mt-2">Copyright Text*{err('copyright')}
              <input className="form-control" name="copyright" value={form.copyright} onChange={handleChange} required />
            </label>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <form className="bg-white p-4 rounded shadow-sm" style={{ maxWidth: 700, margin: '0 auto' }} onSubmit={step === steps.length - 1 ? handleSubmit : handleNext}>
      <div className="mb-4">
        <div className="progress" style={{ height: 8 }}>
          <div className="progress-bar" role="progressbar" style={{ width: `${((step + 1) / steps.length) * 100}%` }} aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length}></div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="fw-bold">Step {step + 1} of {steps.length}: {steps[step].label}</span>
          <div>
            {step > 0 && <button type="button" className="btn btn-secondary btn-sm me-2" onClick={handlePrev}>Back</button>}
            {step < steps.length - 1 && <button type="submit" className="btn btn-primary btn-sm">Next</button>}
            {step === steps.length - 1 && <button type="submit" className="btn btn-success btn-sm">Submit</button>}
          </div>
        </div>
      </div>
      {renderStep()}
    </form>
  );
}
