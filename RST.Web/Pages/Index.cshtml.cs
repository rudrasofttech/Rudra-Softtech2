using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Context;
using RST.Model;
using RST.Web.Service;

namespace RST.Web.Pages
{
    public class IndexModel(ILogger<IndexModel> logger, RSTContext rSTContext, WebsiteSettingsService websiteSettingsService, DataSourceService dataSourceService) : PageModel
    {
        private readonly RSTContext db = rSTContext;
        private readonly ILogger<IndexModel> _logger = logger;
        private readonly WebsiteSettingsService _siteSettingsService = websiteSettingsService;
        private readonly DataSourceService _dataSourceService = dataSourceService;
        public CustomPage CustomPage { get; set; }
        public string CommonHeadContent { get; set; }
        public string SiteHeader { get; set; }
        public string SiteFooter { get; set; }

        public void OnGet(string pagename)
        {
            if (string.IsNullOrEmpty(pagename))
            {
                pagename = "home";
            }
            var cp = db.CustomPages.FirstOrDefault(t => t.Name.ToLower() == pagename.ToLower());
            
            CustomPage = cp ?? new CustomPage();
            
            CommonHeadContent = _siteSettingsService.GetSiteSetting("CommonHeadContent");
            SiteFooter = _siteSettingsService.GetSiteSetting("SiteFooter");
            SiteHeader = _siteSettingsService.GetSiteSetting("SiteHeader");
            #region Replace Custom Data Source
            CustomPage.Body = _dataSourceService.ParseAndPopulate(CustomPage.Body);
            #endregion
            
        }
    }
}
