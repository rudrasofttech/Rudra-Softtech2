// src/data/websiteTypes.js
// Schema definitions for all 8 website types and blank scaffold HTML per type

export const websiteTypes = {
  1: {
    type: "vcard",
    label: "VCard",
    // ...sections as reviewed above
  },
  2: {
    type: "linklist",
    label: "Link List",
    // ...sections as reviewed above
  },
  3: {
    type: "article",
    label: "Article",
    // ...sections as drafted
  },
  4: {
    type: "portfolio",
    label: "Portfolio",
    // ...sections as drafted
  },
  5: {
    type: "ecommerce",
    label: "ECommerce",
    // ...sections as drafted
  },
  6: {
    type: "educational",
    label: "Educational",
    // ...sections as drafted
  },
  7: {
    type: "landingpage",
    label: "Landing Page",
    // ...sections as drafted
  },
  8: {
    type: "resume",
    label: "Resume",
    // ...sections as drafted
  }
};

// Optionally, export blank scaffold HTML per type
export const blankScaffolds = {
  vcard: '<html><body><section data-section="profile"></section><section data-section="contact"></section><section data-section="about"></section><section data-section="social_links"></section><section data-section="photos"></section></body></html>',
  linklist: '<html><body><section data-section="profile"></section><section data-section="links"></section><section data-section="social_links"></section></body></html>',
  // ...other types
};
