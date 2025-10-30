using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Context;
using RST.Model;
using RST.Services;

namespace VC4.Pages
{
    public class IndexModel(RSTContext context, ILogger<IndexModel> logger, IUserWebsiteRenderService _userWebsite) : PageModel
    {
        private readonly ILogger<IndexModel> _logger = logger;
        private readonly RSTContext _context = context;
        private readonly IUserWebsiteRenderService userWebsite = _userWebsite;

        public string? Subdomain { get; private set; }
        public UserWebsite? UserWebsite { get; private set; }
        public string PageHtml { get; set; } = string.Empty;
        public string? WebstatsId { get; set; } = string.Empty;
        public async void OnGet()
        {
            DateTime start = DateTime.UtcNow;
            try
            {
                var host = Request.Host.Host; // e.g., "user1.vc4.in"
                var parts = host.Split('.');

                // Assumes domain is like subdomain.domain.tld
                if (parts.Length > 2)
                {
                    Subdomain = parts[0]; // "user1"
                    UserWebsite = _context.UserWebsites.FirstOrDefault(uw => uw.Name == Subdomain);
                    if (UserWebsite == null)
                    {
                        _logger.LogWarning("No UserWebsite found for subdomain: {Subdomain}", Subdomain);
                        // Read NotFound.html from Pages folder
                        var notFoundPath = Path.Combine(Directory.GetCurrentDirectory(), "Pages", "NotFound.html");
                        if (System.IO.File.Exists(notFoundPath))
                        {
                            var html = System.IO.File.ReadAllText(notFoundPath);
                            var fullUrl = $"{Request.Scheme}://{Request.Host}{Request.Path}";
                            PageHtml = html.Replace("[fullurl]", fullUrl);
                        }
                        else
                        {
                            PageHtml = "<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>";
                        }
                    }
                    else if (UserWebsite.Status != RecordStatus.Active)
                    {
                        _logger.LogWarning("UserWebsite found for subdomain: {Subdomain} but status is not Active", Subdomain);
                        // Read Inactive.html from Pages folder
                        var inactivePath = Path.Combine(Directory.GetCurrentDirectory(), "Pages", "Inactive.html");
                        if (System.IO.File.Exists(inactivePath))
                        {
                            var html = System.IO.File.ReadAllText(inactivePath);
                            var fullUrl = $"{Request.Scheme}://{Request.Host}{Request.Path}";
                            PageHtml = html.Replace("[fullurl]", fullUrl);
                        }
                        else
                        {
                            PageHtml = "<h1>Site Inactive</h1><p>The site you are looking for is currently inactive.</p>";
                        }
                    }
                    else
                    {
                        if (UserWebsite.WSType == WebsiteType.VCard)
                        {
                            UserWebsite.VisitingCardDetail = System.Text.Json.JsonSerializer.Deserialize<VisitingCardDetail>(UserWebsite.JsonData);
                            PageHtml = await userWebsite.GetRenderedHtmlAsync(UserWebsite.Html, UserWebsite.VisitingCardDetail);
                            WebstatsId = UserWebsite.WebstatsScript;
                        }
                        else if (UserWebsite.WSType == WebsiteType.LinkList)
                        {
                            UserWebsite.LinkListDetail = System.Text.Json.JsonSerializer.Deserialize<LinkListDetail>(UserWebsite.JsonData);
                            PageHtml = await userWebsite.GetRenderedHtmlAsync(UserWebsite.Html, UserWebsite.LinkListDetail);
                            WebstatsId = UserWebsite.WebstatsScript;
                        }
                        else
                        {
                            _logger.LogWarning("Unsupported WebsiteType: {WSType} for UserWebsite: {Subdomain}", UserWebsite.WSType, Subdomain);
                        }
                    }
                }
                else
                {
                    // Read main.html from Pages folder and set PageHtml
                    var mainHtmlPath = Path.Combine(Directory.GetCurrentDirectory(), "Pages", "main.html");
                    if (System.IO.File.Exists(mainHtmlPath))
                    {
                        PageHtml = System.IO.File.ReadAllText(mainHtmlPath);
                    }
                    else
                    {
                        PageHtml = "<h1>Main Page</h1><p>main.html not found.</p>";
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing subdomain from host: {Host}", Request.Host.Host);
            }
            _logger.LogInformation("Request for host: {Host} handled in {Duration} ms", Request.Host.Host, (DateTime.UtcNow - start).TotalSeconds);
        }
    }
}