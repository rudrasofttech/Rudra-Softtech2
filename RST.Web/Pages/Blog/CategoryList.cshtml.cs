using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Web.Service;

namespace RST.Web.Pages.Blog
{
    public class CategoryListModel(ILogger<CategoryListModel> logger, RSTContext rSTContext, WebsiteSettingsService websiteSettingsService, DataSourceService dataSourceService) : PageModel
    {
        private readonly RSTContext db = rSTContext;
        private readonly ILogger<CategoryListModel> _logger = logger;
        private readonly WebsiteSettingsService _siteSettingsService = websiteSettingsService;
        private readonly DataSourceService _dataSourceService = dataSourceService;

        public List<Post> Posts { get; set; } = [];
        public List<Category> Categories { get; set; } = [];
        public string CommonHeadContent { get; set; } = string.Empty;
        public string SiteHeader { get; set; } = string.Empty;
        public string SiteFooter { get; set; } = string.Empty;

        public void OnGet(string category)
        {
            var c = db.Categories.FirstOrDefault(t => t.UrlName.ToLower() == category.ToLower());
            if (c != null)
            {
                Posts.AddRange(db.Posts.Where(t => t.Category.ID == c.ID));
            }
            Categories.AddRange(db.Categories.Where(t => t.Status == RecordStatus.Active).OrderBy(t => t.Name));
            CommonHeadContent = _siteSettingsService.GetSiteSetting("CommonHeadContent");
            SiteFooter = _siteSettingsService.GetSiteSetting("SiteFooter");
            SiteHeader = _siteSettingsService.GetSiteSetting("SiteHeader");
        }
    }
}
