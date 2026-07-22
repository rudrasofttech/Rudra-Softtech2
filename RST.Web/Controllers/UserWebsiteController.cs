using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RST.Context;
using RST.Model;
using RST.Model.DTO.UserWebsite;
using RST.Services;
using RST.Web.Service;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace RST.Web.Controllers
{
    /// <summary>
    /// Provides API endpoints for managing user websites, including operations such as creation, retrieval, updating,
    /// and deletion of websites. Supports multiple website types, including VCard, LinkList, and Canvas.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserWebsiteController(
        IUserWebsiteService userWebsiteService,
        ILogger<UserWebsiteController> logger,
        IUserWebsiteRenderService userWebsiteRenderService,
        RSTContext db, EmailService emailService) : RSTBaseController(db)
    {
        private readonly IUserWebsiteService _userWebsiteService = userWebsiteService;
        private readonly ILogger<UserWebsiteController> _logger = logger;
        private readonly IUserWebsiteRenderService _userWebsiteRenderService = userWebsiteRenderService;
        private readonly EmailService _emailService = emailService;

        [HttpGet]
        [Route("templates")]
        public async Task<IActionResult> GetTemplatesAsync([FromQuery]int p = 1, [FromQuery]WebsiteType ws= WebsiteType.None, [FromQuery]string k = "")
        {
            
            try
            {
                var result = await _userWebsiteService.GetTemplatesPagedAsync(p, 20, ws, k);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching templates");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet("mywebsites")]
        public async Task<IActionResult> GetMyWebsites()
        {
            try
            {
                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });
                var result = await _userWebsiteService.GetMyWebsitesAsync(member);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user websites");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            try
            {
                var obj = await _userWebsiteService.GetByIdAsync(id);
                if (obj == null)
                    return NotFound(new { error = "Website not found." });

                if (obj.WSType == WebsiteType.VCard && !string.IsNullOrWhiteSpace(obj.JsonData))
                {
                    try
                    {
                        obj.VisitingCardDetail = JsonSerializer.Deserialize<VisitingCardDetail>(obj.JsonData) ?? new VisitingCardDetail();
                    }
                    catch (JsonException jsonEx)
                    {
                        _logger.LogError(jsonEx, "Error deserializing VisitingCardDetail for website {WebsiteId}", id);
                        return BadRequest(new { error = "Invalid data format for Visiting Card details." });
                    }
                }
                else if (obj.WSType == WebsiteType.LinkList && !string.IsNullOrWhiteSpace(obj.JsonData))
                {
                    try
                    {
                        obj.LinkListDetail = JsonSerializer.Deserialize<LinkListDetail>(obj.JsonData) ?? new LinkListDetail();
                    }
                    catch (JsonException jsonEx)
                    {
                        _logger.LogError(jsonEx, "Error deserializing LinkListDetail for website {WebsiteId}", id);
                        return BadRequest(new { error = "Invalid data format for Link list details." });
                    }
                }
                // Canvas: JsonData is the raw canvas payload — returned as-is via the Thumbnail field,
                // no deserialization needed since JsonData is [JsonIgnore]d on the model.

                return Ok(obj);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("isuniquename")]
        public async Task<IActionResult> IsUniqueName([FromBody] ValidWebsiteNameDTO model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var exists = !(await _userWebsiteService.IsUniqueNameAsync(model.Name));
                if (exists)
                    return Conflict(new { error = "Website with this name already exists." });

                return Ok(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking name exists");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUserWebsiteDTO model)
        {
            try
            {
                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });
                
                model.HTML = SanitizeHtml(model.HTML);

                var uw = await _userWebsiteService.CreateAsync(model, member);
                if (uw == null)
                    return BadRequest(new { error = "Website with this name already exists or theme not found." });

                return Ok(uw);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("update")]
        public async Task<IActionResult> Update([FromBody] UpdateUserWebsiteDTO model)
        {
            try
            {
                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                model.HTML = SanitizeHtml(model.HTML);
                var uw = await _userWebsiteService.UpdateAsync(model, member);
                if (uw == null)
                    return BadRequest(new { error = "Website with this name already exists or theme not found." });

                return Ok(uw);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("createvcard")]
        public async Task<IActionResult> CreateVCard([FromBody] CreateVCardWebsiteDTO model)
        {
            try
            {
                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });
                SetBearerTokeninUserWebsiteServer();
                var userWebsite = await _userWebsiteService.CreateVCardAsync(model, member, HttpContext.Request);
                if (userWebsite == null)
                    return BadRequest(new { error = "Website name already exists or theme not found." });

                return Ok(userWebsite);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating VCard website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("createlinklist")]
        public async Task<IActionResult> CreateLinkList([FromBody] CreateLinkListWebsiteDTO model)
        {
            try
            {
                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });
                SetBearerTokeninUserWebsiteServer();
                var userWebsite = await _userWebsiteService.CreateLinkListAsync(model, member, HttpContext.Request);
                if (userWebsite == null)
                    return BadRequest(new { error = "Website name already exists or theme not found." });

                return Ok(userWebsite);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating LinkList website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("createcanvas")]
        public async Task<IActionResult> CreateCanvas([FromBody] CreateCanvasWebsiteDTO model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                var userWebsite = await _userWebsiteService.CreateCanvasAsync(model, member, HttpContext.Request);
                if (userWebsite == null)
                    return BadRequest(new { error = "Website name already exists." });

                return Ok(userWebsite);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Canvas website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });
                SetBearerTokeninUserWebsiteServer();
                var deleted = await _userWebsiteService.DeleteAsync(id, member);
                if (!deleted)
                    return NotFound(new { error = "Website not found or you do not have permission to delete it." });

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("updatevcard")]
        public async Task<IActionResult> UpdateVCard([FromBody] UpdateVCardModel model)
        {
            try
            {
                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });
                SetBearerTokeninUserWebsiteServer();
                var uw = await _userWebsiteService.UpdateVCardAsync(model, member, HttpContext.Request, _logger);
                if (uw == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });

                return Ok(uw);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user Visiting Card");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("updatelinklist")]
        public async Task<IActionResult> UpdateLinkList([FromBody] UpdateLinkListModel model)
        {
            try
            {
                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });
                SetBearerTokeninUserWebsiteServer();
                var uw = await _userWebsiteService.UpdateLinkListAsync(model, member, HttpContext.Request, _logger);
                if (uw == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });

                return Ok(uw);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating LinkList website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("updatecanvas")]
        public async Task<IActionResult> UpdateCanvas([FromBody] UpdateCanvasModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                var uw = await _userWebsiteService.UpdateCanvasAsync(model, member, HttpContext.Request, _logger);
                if (uw == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });

                return Ok(uw);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating Canvas website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost("updatetheme")]
        public async Task<IActionResult> UpdateTheme([FromBody] UpdateThemeModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                var website = await _userWebsiteService.UpdateThemeAsync(model, member);
                if (website == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });

                return Ok(website);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet("updatestatus/{id}")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] RecordStatus status)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                var website = await _userWebsiteService.UpdateStatusAsync(id, status, member);
                if (website == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });
                if (website.Status == RecordStatus.Active)
                {
                    try
                    {
                        _emailService.SendWebsiteActive(member, website);
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError(emailEx, "Error sending website active email for website {WebsiteId}", website.Id);
                    }
                }
                return Ok(website);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating website status");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet("html/{id}")]
        public async Task<IActionResult> GetHtml(Guid id)
        {
            try
            {
                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                var html = await _userWebsiteService.GetHtmlAsync(id, member, _userWebsiteRenderService);
                if (html == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });

                return Ok(new { html });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching website HTML");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        private void SetBearerTokeninUserWebsiteServer()
        {
            if (HttpContext.Request.Headers.TryGetValue("Authorization", out var authHeader))
            {
                var headerValue = authHeader.ToString();
                if (headerValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    _userWebsiteService.Token = headerValue["Bearer ".Length..].Trim();
                }
            }
        }

        private static string SanitizeHtml(string html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return string.Empty;

            // Remove <script>...</script> blocks (case-insensitive, multiline, non-greedy)
            html = Regex.Replace(html, @"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>", string.Empty, RegexOptions.IgnoreCase | RegexOptions.Singleline);

            // Remove server-side code blocks: <% ... %> (ASP.NET), @{ ... } (Razor), <!--# ... --> (SSI)
            html = Regex.Replace(html, @"<%.*?%>", string.Empty, RegexOptions.Singleline);
            html = Regex.Replace(html, @"@\{.*?\}", string.Empty, RegexOptions.Singleline);
            html = Regex.Replace(html, @"<!--#.*?-->", string.Empty, RegexOptions.Singleline);

            // Remove PHP code blocks: <?php ... ?> and <?= ... ?>
            html = Regex.Replace(html, @"<\?(php|=)?[\s\S]*?\?>", string.Empty, RegexOptions.IgnoreCase);

            // Remove Ruby ERB code blocks: <% ... %> and <%= ... %>
            html = Regex.Replace(html, @"<%=?[\s\S]*?%>", string.Empty, RegexOptions.Singleline);

            // Optionally, remove inline event handlers (e.g., onclick="...", onload='...')
            html = Regex.Replace(html, @"\son\w+\s*=\s*(['""]).*?\1", string.Empty, RegexOptions.IgnoreCase | RegexOptions.Singleline);

            return html;
        }
    }
}

