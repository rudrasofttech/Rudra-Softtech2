using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Context;
using RST.Model;
using RST.Web.Service;

namespace RST.Web.Pages.Blog
{
    public class IndexModel(ILogger<IndexModel> logger, RSTContext context, WebsiteSettingsService websiteSettingsService) : PageModel
    {
        private readonly ILogger<IndexModel> _logger = logger;
        private readonly RSTContext _context = context;
        private readonly WebsiteSettingsService _siteSettingsService = websiteSettingsService;

        public List<Post> Posts { get; set; } = [];
        public List<Category> Categories { get; set; } = [];
        public string CommonHeadContent { get; set; } = string.Empty;
        public string SiteHeader { get; set; } = string.Empty;
        public string SiteFooter { get; set; } = string.Empty;

        public void OnGet()
        {
            CommonHeadContent = _siteSettingsService.GetSiteSetting("CommonHeadContent");
            SiteFooter = _siteSettingsService.GetSiteSetting("SiteFooter");
            SiteHeader = _siteSettingsService.GetSiteSetting("SiteHeader");
            Categories.AddRange(_context.Categories.Where(t => t.Status == MemberStatus.Active).OrderBy(t => t.Name));
            Posts.Clear();
            Posts.AddRange(_context.Posts.OrderByDescending(t => t.DateCreated));
        }
    }
}
