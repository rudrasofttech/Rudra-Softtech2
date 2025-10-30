using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Build.Framework;
using RST.Context;
using RST.Model;
using RST.Model.DTO.UserWebsite;
using RST.Services;
using RST.Web.Service;
using System.Text.Json;

namespace RST.Web.Controllers
{
    /// <summary>
    /// Provides API endpoints for managing user websites, including operations such as creation, retrieval, updating,
    /// and deletion of websites. Supports multiple website types, including VCard and LinkList.
    /// </summary>
    /// <remarks>This controller is secured with authorization and requires the user to be authenticated. It
    /// provides functionality for managing user-specific websites, including checking for unique names, updating
    /// themes, and rendering HTML for specific website types. The controller also handles role-based access control for
    /// certain operations.</remarks>
    /// <param name="context"></param>
    /// <param name="_logger"></param>
    /// <param name="_userWebsite"></param>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserWebsiteController(
        IUserWebsiteService userWebsiteService,
        ILogger<UserWebsiteController> logger,
        IUserWebsiteRenderService userWebsiteRenderService,
        RSTContext db, EmailService emailService) : ControllerBase
    {
        private readonly IUserWebsiteService _userWebsiteService = userWebsiteService;
        private readonly ILogger<UserWebsiteController> _logger = logger;
        private readonly IUserWebsiteRenderService _userWebsiteRenderService = userWebsiteRenderService;
        private readonly RSTContext _db = db;
        private readonly EmailService _emailService = emailService;

        private Member? GetCurrentMember()
        {
            var email = User.Claims.FirstOrDefault(t => t.Type == System.Security.Claims.ClaimTypes.Email)?.Value;
            if (string.IsNullOrWhiteSpace(email))
                return null;
            return _db.Members.FirstOrDefault(d => d.Email == email);
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int page = 1, [FromQuery] int psize = 20)
        {
            var member = GetCurrentMember();
            if (member == null || !member.IsAdmin)
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
            {
                var result = await _userWebsiteService.GetPagedAsync(page, psize, member);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user websites");
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
                if (obj != null)
                {
                    if (obj.WSType == WebsiteType.VCard && !string.IsNullOrWhiteSpace(obj.JsonData))
                    {
                        try
                        {
                            obj.VisitingCardDetail = JsonSerializer.Deserialize<VisitingCardDetail>(obj.JsonData) ?? new VisitingCardDetail();
                            return Ok(obj);
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
                            return Ok(obj);
                        }
                        catch (JsonException jsonEx)
                        {
                            _logger.LogError(jsonEx, "Error deserializing LinkListDetail for website {WebsiteId}", id);
                            return BadRequest(new { error = "Invalid data format for Link list details." });
                        }
                    }
                }
                return NotFound(new { error = "Website not found." });
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
                _logger.LogError(ex, "Error updating website theme");
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
    }
}

