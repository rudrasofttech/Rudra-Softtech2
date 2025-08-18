using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RST.Context;
using RST.Model;
using RST.Model.DTO.UserWebsite;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserWebsiteThemeController(RSTContext context, ILogger<UserWebsiteThemeController> _logger) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<UserWebsiteThemeController> logger = _logger;

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
        public IActionResult Get([FromQuery] string k = "", [FromQuery] int page = 1, [FromQuery] int psize = 20)
        {
            try
            {
                var query = db.UserWebsiteThemes.AsQueryable();

                if (!string.IsNullOrWhiteSpace(k))
                {
                    var keywords = k.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                    foreach (var word in keywords)
                    {
                        var temp = word; // Prevent modified closure issue in EF
                        query = query.Where(t =>
                            (t.Name != null && t.Name.Contains(temp)) ||
                            (t.Tags != null && t.Tags.Contains(temp))
                        );
                    }
                }

                int count = query.Count();

                var result = new PagedData<UserWebsiteTheme>
                {
                    PageIndex = page,
                    PageSize = psize,
                    TotalRecords = count
                };

                var pagedQuery = query.OrderBy(t => t.CreateDate)
                                      .Skip((page - 1) * psize)
                                      .Take(psize);

                result.Items.AddRange([.. pagedQuery]);
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching user website themes");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet("{id:guid}")]
        public IActionResult Get(Guid id)
        {
            try
            {
                var theme = db.UserWebsiteThemes.FirstOrDefault(t => t.Id == id);
                if (theme == null)
                {
                    return NotFound(new { error = "Theme not found" });
                }
                return Ok(theme);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching user website theme by ID");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("create")]
        public IActionResult Create([FromBody] PostUserWebsiteThemeDTO model)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            if(ModelState.IsValid == false)
            {
                return BadRequest(ModelState);
            }
            if (model == null)
            {
                return BadRequest(new { error = "Invalid theme data" });
            }
            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var m = db.Members.First(d => d.Email == email);
                var theme = new UserWebsiteTheme
                {
                    Name = model.Name,
                    Tags = model.Tags,
                    Html = model.Html,
                    WSType = model.WSType,
                    Thumbnail = model.Thumbnail,
                    CreateDate = DateTime.UtcNow,
                    ModifyDate = null,
                    CreatedById = m.ID
                };
                db.UserWebsiteThemes.Add(theme);
                db.SaveChanges();
                return CreatedAtAction(nameof(Get), new { id = theme.Id }, theme);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating user website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("update/{id}")]
        public IActionResult Update(Guid id, [FromBody] PostUserWebsiteThemeDTO model)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            if (ModelState.IsValid == false)
            {
                return BadRequest(ModelState);
            }
            if (model == null || id == Guid.Empty)
            {
                return BadRequest(new { error = "Invalid theme data" });
            }
            try
            {

                var existingTheme = db.UserWebsiteThemes.FirstOrDefault(t => t.Id == id);
                if (existingTheme == null)
                {
                    return NotFound(new { error = "Theme not found" });
                }
                existingTheme.Name = model.Name;
                existingTheme.Tags = model.Tags;
                existingTheme.Html = model.Html;
                existingTheme.Thumbnail = model.Thumbnail;
                existingTheme.ModifyDate = DateTime.UtcNow;
                existingTheme.WSType = model.WSType;
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var m = db.Members.First(d => d.Email == email);
                existingTheme.ModifiedById = m.ID;
                db.SaveChanges();
                return Ok(existingTheme);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating user website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet]
        [Route("delete/{id}")]
        public IActionResult Delete(Guid id)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
            {
                var theme = db.UserWebsiteThemes.FirstOrDefault(t => t.Id == id);
                if (theme == null)
                {
                    return NotFound(new { error = "Theme not found" });
                }
                db.UserWebsiteThemes.Remove(theme);
                db.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting user website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }
    }
}
