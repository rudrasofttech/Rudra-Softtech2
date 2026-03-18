import React from 'react';
import WebsiteFormWizard from './WebsiteFormWizard';

// WebsiteForm now wraps the step-by-step wizard
export default function WebsiteForm(props) {
  return <WebsiteFormWizard {...props} />;
}
