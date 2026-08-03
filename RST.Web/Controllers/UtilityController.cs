using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RST.Context;
using RST.Model;
using RST.Web.Service;
using System.Text;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class UtilityController(ILogger<UtilityController> _logger, RSTContext context, IWebHostEnvironment env, WebsiteSettingsService wsService) : RSTBaseController(context)
    {
        private readonly ILogger<UtilityController> logger = _logger;

        [HttpGet("sitemap")]
        public IActionResult GetSiteMap()
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            var sitemapPath = Path.Combine(env.WebRootPath, "sitemap.xml");

            if (!System.IO.File.Exists(sitemapPath))
            {
                logger.LogWarning("sitemap.xml not found at {Path}", sitemapPath);
                return NotFound(new { message = "sitemap.xml not found." });
            }

            var content = System.IO.File.ReadAllText(sitemapPath);
            return Content(content, "application/xml");
        }

        [HttpPost("generate-sitemap")]
        public IActionResult GenerateSiteMap()
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            try
            {
                var siteUrl = wsService.SiteURL.TrimEnd('/');
                var builder = new StringBuilder();

                builder.Append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
                builder.Append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

                // Static pages
                AppendUrl(builder, $"{siteUrl}/");
                AppendUrl(builder, $"{siteUrl}/blog");

                // Active categories
                var categories = db.Categories
                    .Where(c => c.Status == RecordStatus.Active)
                    .ToList();

                foreach (var category in categories)
                {
                    AppendUrl(builder, $"{siteUrl}/blog/{category.UrlName}/index");
                }

                // Published custom pages flagged for sitemap
                var customPages = db.CustomPages
                    .Where(p => p.Status == PostStatus.Publish && p.Sitemap)
                    .ToList();

                foreach (var page in customPages)
                {
                    AppendUrl(builder, $"{siteUrl}/{page.Name}", page.DateModified ?? page.DateCreated);
                }

                // Published blog posts flagged for sitemap
                var posts = db.Posts
                    .Where(p => p.Status == PostStatus.Publish && p.Sitemap)
                    .OrderByDescending(p => p.DateCreated)
                    .ToList();

                foreach (var post in posts)
                {
                    AppendUrl(builder, Utility.GenerateBlogArticleURL(post, siteUrl), post.DateModified ?? post.DateCreated);
                }

                builder.Append("</urlset>");

                var sitemapPath = Path.Combine(env.WebRootPath, "sitemap.xml");
                System.IO.File.WriteAllText(sitemapPath, builder.ToString(), Encoding.UTF8);

                logger.LogInformation("sitemap.xml generated with {PostCount} posts and {PageCount} custom pages.", posts.Count, customPages.Count);

                return Ok(new { message = "sitemap.xml generated successfully.", posts = posts.Count, customPages = customPages.Count });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error generating sitemap.xml");
                return StatusCode(500, new { error = "Failed to generate sitemap.xml." });
            }
        }

        private static void AppendUrl(StringBuilder builder, string loc, DateTime? lastMod = null)
        {
            builder.Append("<url>");
            builder.Append($"<loc>{loc}</loc>");
            if (lastMod.HasValue)
                builder.Append($"<lastmod>{lastMod.Value:yyyy-MM-dd}</lastmod>");
            builder.Append("</url>");
        }
    }
}
