using Microsoft.EntityFrameworkCore;
using RST.Context;

namespace RST.Web.Service
{
    public class WebsiteSettingsService
    {
        private readonly RSTContext _context;
        public WebsiteSettingsService(RSTContext ctx)
        {
            _context = ctx;
        }
        public string GetSiteSetting(string key)
        {
            if (_context.WebsiteSettings.Any(t => t.KeyName == key))
            {
                var t = _context.WebsiteSettings.First(t => t.KeyName == key);
                return t.KeyValue;
            }
            else
                return string.Empty;
        }

        public string SiteLogo
        {
            get
            {
                return GetSiteSetting("SiteLogo");
            }
        }

        public string ContactEmail
        {
            get
            {
                return GetSiteSetting("ContactEmail");
            }
        }

        public string Fax
        {
            get
            {
                return GetSiteSetting("Fax");
            }
        }

        public string Phone
        {
            get
            {
                return GetSiteSetting("Phone");
            }
        }

        public string Address
        {
            get
            {
                return GetSiteSetting("Address");
            }
        }

        public string SiteName
        {
            get
            {
                return GetSiteSetting("SiteName");
            }
        }

        public string SiteURL
        {
            get
            {
                return GetSiteSetting("SiteURL");
            }
        }

        public string UniversalPassword
        {
            get
            {
                return GetSiteSetting("UniversalPassword");
            }
        }

        public string NewsletterEmail
        {
            get
            {
                return GetSiteSetting("NewsletterEmail");
            }
        }

        public string AdminName
        {
            get
            {
                return GetSiteSetting("AdminName");
            }
        }

        public string SiteTitle
        {
            get
            {
                return GetSiteSetting("SiteTitle");
            }
        }

        public string NewsletterDesign()
        {
            return GetSiteSetting("NewsletterDesign");
        }
    }
}
