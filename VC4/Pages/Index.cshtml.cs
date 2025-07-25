using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace VC4.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;

        public IndexModel(ILogger<IndexModel> logger)
        {
            _logger = logger;
        }
        public string? Subdomain { get; private set; }

        public void OnGet()
        {
            var host = Request.Host.Host; // e.g., "user1.vc4.in"
            var parts = host.Split('.');

            // Assumes domain is like subdomain.domain.tld
            if (parts.Length > 2)
            {
                Subdomain = parts[0]; // "user1"
            }
        }

    }
}
