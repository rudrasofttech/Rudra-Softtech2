using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Context;
using RST.Model;
using RST.Services;

namespace VC4.Pages
{
    public class IndexModel(RSTContext context, ILogger<IndexModel> logger, IUserWebsiteRenderService userWebsite) : PageModel
    {
        private readonly ILogger<IndexModel> _logger = logger;
        private readonly RSTContext _context = context;
        private readonly IUserWebsiteRenderService _userWebsite = userWebsite;

        public string? Subdomain { get; private set; }
        public UserWebsite? UserWebsite { get; private set; }
        public string PageHtml { get; set; } = string.Empty;
        public string? WebstatsId { get; set; } = string.Empty;

        public async Task OnGetAsync()
        {
            DateTime start = DateTime.UtcNow;
            try
            {
                var host = Request.Host.Host;
                var subdomain = GetSubdomain(host);
                var fullUrl = $"{Request.Scheme}://{Request.Host}{Request.Path}";

                if (subdomain != null)
                {
                    Subdomain = subdomain;
                    UserWebsite = _context.UserWebsites.FirstOrDefault(uw => uw.Name == Subdomain);

                    if (UserWebsite == null)
                    {
                        PageHtml = HandleNotFound(fullUrl);
                    }
                    else if (UserWebsite.Status != RecordStatus.Active)
                    {
                        PageHtml = HandleInactive(fullUrl);
                    }
                    else
                    {
                        PageHtml = await RenderUserWebsiteAsync(UserWebsite);
                        WebstatsId = UserWebsite.WebstatsScript;
                    }
                }
                else
                {
                    PageHtml = RenderMainPage();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing subdomain from host: {Host}", Request.Host.Host);
            }
            _logger.LogInformation("Request for host: {Host} handled in {Duration} ms", Request.Host.Host, (DateTime.UtcNow - start).TotalSeconds);
        }

        private string? GetSubdomain(string host)
        {
            var parts = host.Split('.');
            return parts.Length > 2 ? parts[0] : null;
        }

        private string LoadHtmlFile(string fileName, string fullUrl)
        {
            var path = Path.Combine(Directory.GetCurrentDirectory(), "Pages", fileName);
            if (System.IO.File.Exists(path))
            {
                var html = System.IO.File.ReadAllText(path);
                return html.Replace("[fullurl]", fullUrl);
            }
            return null!;
        }

        private string HandleNotFound(string fullUrl)
            => LoadHtmlFile("NotFound.html", fullUrl) ?? "<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>";

        private string HandleInactive(string fullUrl)
            => LoadHtmlFile("Inactive.html", fullUrl) ?? "<h1>Site Inactive</h1><p>The site you are looking for is currently inactive.</p>";

        private string RenderMainPage()
        {
            // Read main.html from Pages folder and set PageHtml
            var mainHtmlPath = Path.Combine(Directory.GetCurrentDirectory(), "Pages", "main.html");
            if (System.IO.File.Exists(mainHtmlPath))
            {
                return System.IO.File.ReadAllText(mainHtmlPath);
            }
            return "<h1>Main Page</h1><p>main.html not found.</p>";
        }

        private async Task<string> RenderUserWebsiteAsync(UserWebsite userWebsite)
        {
            string pageHtml = string.Empty;
            if (!string.IsNullOrEmpty(userWebsite.Output))
            {
                pageHtml = userWebsite.Output;
            }
            if (userWebsite.WSType == WebsiteType.VCard)
            {
                userWebsite.VisitingCardDetail = System.Text.Json.JsonSerializer.Deserialize<VisitingCardDetail>(userWebsite.JsonData);
                pageHtml = await _userWebsite.GetRenderedHtmlAsync(userWebsite.Html, userWebsite.VisitingCardDetail);
            }
            else if (userWebsite.WSType == WebsiteType.LinkList)
            {
                userWebsite.LinkListDetail = System.Text.Json.JsonSerializer.Deserialize<LinkListDetail>(userWebsite.JsonData);
                pageHtml = await _userWebsite.GetRenderedHtmlAsync(userWebsite.Html, userWebsite.LinkListDetail);
            }
            else
            {
                _logger.LogWarning("Unsupported WebsiteType: {WSType} for UserWebsite: {Subdomain}", userWebsite.WSType, Subdomain);
            }

            return pageHtml.Replace("</head>", $"<meta name=\"format-detection\" content=\"telephone=no\" /></head>");
        }
    }
}