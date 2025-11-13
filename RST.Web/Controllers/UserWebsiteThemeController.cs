using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO.UserWebsite;
using RST.Services;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserWebsiteThemeController : ControllerBase
    {
        private readonly IUserWebsiteThemeService _themeService;
        private readonly ILogger<UserWebsiteThemeController> _logger;
        private readonly RSTContext db;
        public UserWebsiteThemeController(IUserWebsiteThemeService themeService, ILogger<UserWebsiteThemeController> logger, RSTContext context)
        {
            _themeService = themeService;
            _logger = logger;
            db = context;
        }

        private bool CheckRole(string roles)
        {
            if (string.IsNullOrWhiteSpace(roles))
                return false;

            var allowedRoles = roles
                .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries)
                .Select(r => r.Trim())
                .Where(r => !string.IsNullOrEmpty(r))
                .ToList();

            var userRoles = User.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            return allowedRoles.Any(ar => userRoles.Any(ur => string.Equals(ar, ur, StringComparison.OrdinalIgnoreCase)));
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string k = "", [FromQuery] int page = 1, [FromQuery] WebsiteType? wstype = WebsiteType.None)
        {
            try
            {
                var result = await _themeService.GetThemesAsync(k, page, 10, wstype, HttpContext.Request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user website themes");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            try
            {
                var theme = await _themeService.GetThemeByIdAsync(id, HttpContext.Request);
                if (theme == null)
                    return NotFound(new { error = "Theme not found" });
                return Ok(theme);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user website theme by ID");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("create")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        public async Task<IActionResult> Create([FromBody] PostUserWebsiteThemeDTO model)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (model == null)
                return BadRequest(new { error = "Invalid theme data" });

            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var createdBy = await GetMemberIdByEmailAsync(email);
                if (createdBy == null)
                    return Unauthorized(new { error = "User not found." });

                var theme = await _themeService.CreateThemeAsync(model, createdBy.Value, HttpContext.Request);
                if (theme == null)
                    return Conflict(new { error = "Theme with this name already exists or thumbnail is invalid." });

                return Ok(theme);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("update/{id}")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        public async Task<IActionResult> Update(Guid id, [FromBody] PostUserWebsiteThemeDTO model)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            if (ModelState.IsValid == false)
                return BadRequest(ModelState);
            if (model == null || id == Guid.Empty)
                return BadRequest(new { error = "Invalid theme data" });

            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var modifiedBy = await GetMemberIdByEmailAsync(email);
                if (modifiedBy == null)
                    return Unauthorized(new { error = "User not found." });

                var theme = await _themeService.UpdateThemeAsync(id, model, modifiedBy.Value, HttpContext.Request);
                if (theme == null)
                    return Conflict(new { error = "Theme not found, duplicate name, or invalid thumbnail." });

                return Ok(theme);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet]
        [Route("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
            {
                var deleted = await _themeService.DeleteThemeAsync(id);
                if (!deleted)
                    return NotFound(new { error = "Theme not found" });
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        private async Task<int?> GetMemberIdByEmailAsync(string email)
        {
            var member = await db.Members.FirstOrDefaultAsync(d => d.Email == email);
            return member?.ID;
        }
    }
}