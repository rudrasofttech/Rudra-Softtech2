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
        public async void OnGet()
        {
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
                    }
                    else
                    {
                        if (UserWebsite.WSType == WebsiteType.VCard)
                        {
                            UserWebsite.VisitingCardDetail = System.Text.Json.JsonSerializer.Deserialize<VisitingCardDetail>(UserWebsite.JsonData);
                            //PageHtml = await VCardHtmlRenderer.RenderTemplateAsync(UserWebsite.Html, UserWebsite.VisitingCardDetail ?? new VisitingCardDetail());
                            PageHtml = await userWebsite.GetRenderedHtmlAsync(UserWebsite.Html, UserWebsite.VisitingCardDetail);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing subdomain from host: {Host}", Request.Host.Host);
            }

        }
    }
}