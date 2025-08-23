using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RST.Context;
using RST.Model;
using RST.Model.DTO.UserWebsite;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        private string? SaveImageFromBase64(string base64Image, Guid fileGuid, string folderRelativePath, int maxWidth, int maxHeight)
        {
            if (string.IsNullOrWhiteSpace(base64Image) || !base64Image.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                return null;

            try
            {
                string fileExt = ".png";
                if (base64Image.StartsWith("data:image/png"))
                    fileExt = ".png";
                else if (base64Image.StartsWith("data:image/jpeg") || base64Image.StartsWith("data:image/jpg"))
                    fileExt = ".jpg";

                var base64Parts = base64Image.Split(',');
                if (base64Parts.Length != 2)
                    return null;

                var bytes = Convert.FromBase64String(base64Parts[1]);
                var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var folderPath = Path.Combine(webRootPath, folderRelativePath);
                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                var fileName = $"{fileGuid}{fileExt}";
                var filePath = Path.Combine(folderPath, fileName);

                // Resize image to maxWidth x maxHeight maintaining aspect ratio
                using (var inputStream = new MemoryStream(bytes))
                using (var image = System.Drawing.Image.FromStream(inputStream))
                {
                    int width = image.Width;
                    int height = image.Height;
                    if (width > maxWidth || height > maxHeight)
                    {
                        double ratio = Math.Min(maxWidth / (double)width, maxHeight / (double)height);
                        width = (int)(image.Width * ratio);
                        height = (int)(image.Height * ratio);
                    }

                    using (var bmp = new System.Drawing.Bitmap(width, height))
                    using (var graphics = System.Drawing.Graphics.FromImage(bmp))
                    {
                        graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
                        graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                        graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                        graphics.Clear(System.Drawing.Color.Transparent);
                        graphics.DrawImage(image, 0, 0, width, height);

                        if (fileExt == ".png")
                            bmp.Save(filePath, System.Drawing.Imaging.ImageFormat.Png);
                        else
                            bmp.Save(filePath, System.Drawing.Imaging.ImageFormat.Jpeg);
                    }
                }

                // Return the relative path for use in the database
                return $"/{folderRelativePath.Replace("\\", "/")}/{fileName}";
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to save or resize image for {Folder}", folderRelativePath);
                return null;
            }
        }

        [HttpGet]
        public IActionResult Get([FromQuery] string k = "", [FromQuery] int page = 1, [FromQuery] int psize = 20, [FromQuery] WebsiteType? wstype = WebsiteType.None)
        {
            try
            {
                var query = db.UserWebsiteThemes.AsQueryable();

                if (wstype.HasValue)
                {
                    query = query.Where(t => t.WSType == wstype.Value);
                }

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
                                      .Take(psize)
                                      .ToList();

                // Prepend host to thumbnail if needed
                var request = HttpContext.Request;
                var hostUrl = $"{request.Scheme}://{request.Host.Value}";

                foreach (var theme in pagedQuery)
                {
                    if (!string.IsNullOrWhiteSpace(theme.Thumbnail) && theme.Thumbnail.StartsWith("/drive/uwstheme", StringComparison.OrdinalIgnoreCase))
                    {
                        theme.Thumbnail = hostUrl + theme.Thumbnail;
                    }
                }

                result.Items.AddRange(pagedQuery);
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

                // Prepend host to thumbnail if needed
                if (!string.IsNullOrWhiteSpace(theme.Thumbnail) && theme.Thumbnail.StartsWith("/drive/uwstheme", StringComparison.OrdinalIgnoreCase))
                {
                    var request = HttpContext.Request;
                    var hostUrl = $"{request.Scheme}://{request.Host.Value}";
                    theme.Thumbnail = hostUrl + theme.Thumbnail;
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
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        public IActionResult Create([FromBody] PostUserWebsiteThemeDTO model)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (model == null)
                return BadRequest(new { error = "Invalid theme data" });

            // Check for duplicate theme name (case-insensitive)
            if (db.UserWebsiteThemes.Any(t => t.Name.ToLower() == model.Name.ToLower()))
                return Conflict(new { error = "Theme with this name already exists." });

            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var m = db.Members.First(d => d.Email == email);

                var themeId = Guid.NewGuid();
                string? thumbnailPath = null;

                if (!string.IsNullOrWhiteSpace(model.Thumbnail) && model.Thumbnail.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                {
                    thumbnailPath = SaveImageFromBase64(model.Thumbnail, themeId, "drive/uwstheme", 500, 500);
                    if (thumbnailPath == null)
                        return BadRequest(new { error = "Invalid thumbnail image." });
                }
                else
                {
                    thumbnailPath = model.Thumbnail;
                }

                var theme = new UserWebsiteTheme
                {
                    Id = themeId,
                    Name = model.Name,
                    Tags = model.Tags,
                    Html = model.Html,
                    WSType = model.WSType,
                    Thumbnail = thumbnailPath,
                    CreateDate = DateTime.UtcNow,
                    ModifyDate = null,
                    CreatedById = m.ID
                };
                db.UserWebsiteThemes.Add(theme);
                db.SaveChanges();
                return Ok(theme);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating user website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("update/{id}")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
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

                // Handle thumbnail update: save if base64, else keep as is
                string? thumbnailPath = model.Thumbnail;
                if (!string.IsNullOrWhiteSpace(model.Thumbnail) && model.Thumbnail.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                {
                    thumbnailPath = SaveImageFromBase64(model.Thumbnail, id, "drive/uwstheme", 500, 500);
                    if (thumbnailPath == null)
                        return BadRequest(new { error = "Invalid thumbnail image." });
                }

                existingTheme.Name = model.Name;
                existingTheme.Tags = model.Tags;
                existingTheme.Html = model.Html;
                existingTheme.Thumbnail = thumbnailPath;
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

                // Remove associated thumbnail file if it exists and is a local file
                if (!string.IsNullOrWhiteSpace(theme.Thumbnail) && theme.Thumbnail.StartsWith("/drive/uwstheme/", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                        var thumbnailPath = Path.Combine(webRootPath, theme.Thumbnail.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                        if (System.IO.File.Exists(thumbnailPath))
                            System.IO.File.Delete(thumbnailPath);
                    }
                    catch (Exception fileEx)
                    {
                        logger.LogWarning(fileEx, "Failed to delete thumbnail file for theme {ThemeId}", theme.Id);
                    }
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
