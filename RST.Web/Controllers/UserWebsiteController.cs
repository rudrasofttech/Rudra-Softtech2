using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO.UserWebsite;
using RST.Services;
using System.Security.Claims;
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
    public class UserWebsiteController(RSTContext context, ILogger<UserWebsiteController> _logger, IUserWebsiteRenderService _userWebsite) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<UserWebsiteController> logger = _logger;
        private readonly IUserWebsiteRenderService userWebsite = _userWebsite;

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
        public IActionResult Get([FromQuery]int page = 1, [FromQuery] int psize = 20)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
            {
                int count = db.UserWebsites.Count();
                var result = new PagedData<UserWebsiteListItemDTO>
                {
                    PageIndex = page,
                    PageSize = psize,
                    TotalRecords = count
                };

                var query = db.UserWebsites.Include(t => t.Owner)
        .OrderBy(t => t.Created)
        .Skip((page - 1) * psize)
        .Take(psize); 

                foreach (var m in query.ToList())
                {
                    var dto = new UserWebsiteListItemDTO
                    {
                        Id = m.Id,
                        Name = m.Name,
                        Domain = m.Domain,
                        Created = m.Created,
                        Modified = m.Modified,
                        Status = m.Status,
                        WSType = m.WSType,
                        OwnerName = m.Owner.FirstName
                    };
                    result.Items.Add(dto);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching user websites");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet]
        [Route("mywebsites")]
        public IActionResult GetMyWebsites()
        {
            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var m = db.Members.First(d => d.Email == email);
                var result = db.UserWebsites.Include(t => t.Owner).Where(t => t.Owner.ID == m.ID)
                    .Select(t => new
                    {
                        t.Id,
                        t.Name,
                        t.Created,
                        t.Modified,
                        t.Status,
                        t.Domain
                    })
                    .ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching user websites");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet("{id}")]
        public IActionResult Get(Guid id)
        {
            try
            {
                var obj = db.UserWebsites.FirstOrDefault(t => t.Id == id);
                if(obj != null)
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
                            logger.LogError(jsonEx, "Error deserializing VisitingCardDetail for website {WebsiteId}", id);
                            return BadRequest(new { error = "Invalid data format for Visiting Card details." });
                        }
                    }
                }
                return NotFound(new { error = "Website not found."});
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching user website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("isuniquename")]
        public IActionResult IsUniqueName([FromBody] ValidWebsiteNameDTO model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = db.UserWebsites.Any(t => t.Name == model.Name);
                
                if(result)
                    return Conflict(new { error = "Website with this name already exists." });

                return Ok(true);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error checking name exists");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("create")]
        public IActionResult Create([FromBody] CreateUserWebsiteDTO model)
        {
            try
            {
                if (db.UserWebsites.Any(t => t.Name == model.Name))
                    return BadRequest(new { error = "Website with this name already exists." });

                // Load the theme using ThemeId from the model
                var theme = db.UserWebsiteThemes.FirstOrDefault(t => t.Id == model.ThemeId);
                if (theme == null)
                    return BadRequest(new { error = "Theme not found." });

                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var m = db.Members.First(d => d.Email == email);
                var uw = new UserWebsite()
                {
                    Created = DateTime.UtcNow,
                    Name = model.Name,
                    Owner = m,
                    Status = RecordStatus.Inactive,
                    WSType = model.WSType,
                    Html = theme.Html,         // Set Html from theme
                    ThemeId = theme.Id         // Set ThemeId from theme
                };
                if (uw.WSType == WebsiteType.VCard)
                    uw.VisitingCardDetail = new VisitingCardDetail();

                uw.JsonData = JsonSerializer.Serialize(uw.JsonData);
                db.UserWebsites.Add(uw);
                db.SaveChanges();

                return Ok(uw);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating user website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("createvcard")]
        public IActionResult CreateVCard([FromBody] CreateVCardWebsiteDTO model)
        {
            try
            {
                // Check for duplicate website name
                if (db.UserWebsites.Any(t => t.Name == model.WebsiteName))
                    return BadRequest(new { error = "Website name already exists." });

                // Validate theme
                var theme = db.UserWebsiteThemes.FirstOrDefault(t => t.Id == model.ThemeId);
                if (theme == null)
                    return BadRequest(new { error = "Theme not found." });

                // Extract email from user claims
                var emailClaim = User.Claims.FirstOrDefault(t => t.Type == ClaimTypes.Email);
                if (emailClaim == null)
                    return Unauthorized(new { error = "Email claim missing." });

                var member = db.Members.FirstOrDefault(d => d.Email == emailClaim.Value);
                if (member == null)
                    return Unauthorized(new { error = "User not registered." });

                // Assemble VCard details
                var vcardDetail = new VisitingCardDetail
                {
                    Company = model.Company,
                    Logo = model.Logo,
                    TagLine = model.TagLine,
                    Keywords = model.Keywords,
                    PersonName = model.PersonName,
                    Designation = model.Designation,
                    WhatsApp = model.WhatsApp,
                    Telegram = model.Telegram,
                    Youtube = model.Youtube,
                    Instagram = model.Instagram,
                    LinkedIn = model.LinkedIn,
                    Twitter = model.Twitter,
                    Facebook = model.Facebook,
                    Email = model.Email,
                    Phone1 = model.Phone1,
                    Phone2 = model.Phone2,
                    Phone3 = model.Phone3,
                    Address = model.Address,
                    AboutInfo = model.AboutInfo,
                    Photos = model.Photos ?? []
                };

                var userWebsite = new UserWebsite
                {
                    Created = DateTime.UtcNow,
                    Name = model.WebsiteName,
                    Owner = member,
                    WSType = WebsiteType.VCard,
                    Status = RecordStatus.Inactive,
                    ThemeId = theme.Id,
                    Html = theme.Html,
                    VisitingCardDetail = vcardDetail,
                    JsonData = JsonSerializer.Serialize(vcardDetail)
                };

                db.UserWebsites.Add(userWebsite);
                db.SaveChanges();

                return Ok(userWebsite);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating VCard website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet]
        [Route("delete/{id}")]
        public IActionResult Delete(Guid id)
        {
            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var m = db.Members.First(d => d.Email == email);
                var uw = db.UserWebsites.Include(t => t.Owner).FirstOrDefault(t => t.Id == id && t.Owner.ID == m.ID);
                if (uw == null)
                    return NotFound(new { error = "Website not found or you do not have permission to delete it." });

                // Remove associated folder (drive/uwpics/{id})
                try
                {
                    var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var folderPath = Path.Combine(webRootPath, "drive", "uwpics", uw.Id.ToString());
                    if (Directory.Exists(folderPath))
                        Directory.Delete(folderPath, true);
                }
                catch (Exception dirEx)
                {
                    logger.LogWarning(dirEx, "Failed to delete folder for website {WebsiteId}", uw.Id);
                }

                db.UserWebsites.Remove(uw);
                db.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating user website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        /// <summary>
        /// Updates the visiting card details for a specified user website.
        /// </summary>
        /// <remarks>This method allows authenticated users to update the visiting card details of their
        /// websites.  The visiting card details include fields such as company name, tagline, contact information, and
        /// social media links.  If a logo is provided as a base64-encoded string, it is saved as an image file and
        /// resized to 300x300 pixels.  If the logo is removed, any existing logo files are deleted.  The method ensures
        /// that only the owner of the website can update its details.</remarks>
        /// <param name="model">An object containing the updated visiting card details, including optional logo data and other fields.</param>
        /// <returns>An <see cref="IActionResult"/> indicating the result of the operation.  Returns <see cref="OkObjectResult"/>
        /// with the updated website details if the operation is successful.  Returns <see cref="NotFoundObjectResult"/>
        /// if the website is not found or the user does not have permission to update it.  Returns <see
        /// cref="StatusCodeResult"/> with a status code of 500 if an internal server error occurs.</returns>
        [HttpPost]
        [Route("updatevcard")]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        public IActionResult UpdateVCard([FromBody] UpdateVCardModel model)
        {
            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var m = db.Members.First(d => d.Email == email);
                var uw = db.UserWebsites.Include(t => t.Owner).FirstOrDefault(t => t.Id == model.Id && t.Owner.ID == m.ID);

                if (uw == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });
                if (uw.WSType == WebsiteType.VCard)
                {
                    if (!string.IsNullOrWhiteSpace(uw.JsonData))
                    {
                        try
                        {
                            uw.VisitingCardDetail = JsonSerializer.Deserialize<VisitingCardDetail>(uw.JsonData) ?? new VisitingCardDetail();
                        }
                        catch (JsonException jsonEx)
                        {
                            logger.LogError(jsonEx, "Error deserializing VisitingCardDetail for website {WebsiteId}", uw.Id);
                            uw.VisitingCardDetail = new VisitingCardDetail(); // Reset to default if deserialization fails
                        }
                    }
                    else
                    {
                        uw.VisitingCardDetail = new VisitingCardDetail();
                    }

                    // Get host url (scheme + host + port if present)
                    var request = HttpContext.Request;
                    var hostUrl = $"{request.Scheme}://{request.Host.Value}";

                    // Handle Logo file logic
                    var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var logoFolder = Path.Combine(webRootPath, "drive", "uwpics", uw.Id.ToString());
                    var logoPngPath = Path.Combine(logoFolder, "logo.png");
                    var logoJpgPath = Path.Combine(logoFolder, "logo.jpg");

                    // If model.Logo is null or empty and DB has a logo, delete the file and clear the field
                    if (string.IsNullOrWhiteSpace(model.Logo) && !string.IsNullOrWhiteSpace(uw.VisitingCardDetail.Logo))
                    {
                        try
                        {
                            if (System.IO.File.Exists(logoPngPath))
                                System.IO.File.Delete(logoPngPath);
                            if (System.IO.File.Exists(logoJpgPath))
                                System.IO.File.Delete(logoJpgPath);
                        }
                        catch (Exception fileEx)
                        {
                            logger.LogWarning(fileEx, "Failed to delete logo file for website {WebsiteId}", uw.Id);
                        }
                        uw.VisitingCardDetail.Logo = string.Empty;
                    }
                    // If model.Logo is base64, save it as logo.png or logo.jpg and resize to 200x200
                    else if (!string.IsNullOrWhiteSpace(model.Logo) && model.Logo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            // Parse base64 header
                            var base64Data = model.Logo;
                            string fileExt = ".png";
                            if (base64Data.StartsWith("data:image/png"))
                                fileExt = ".png";
                            else if (base64Data.StartsWith("data:image/jpeg") || base64Data.StartsWith("data:image/jpg"))
                                fileExt = ".jpg";

                            var base64Parts = base64Data.Split(',');
                            if (base64Parts.Length == 2)
                            {
                                var bytes = Convert.FromBase64String(base64Parts[1]);
                                if (!Directory.Exists(logoFolder))
                                    Directory.CreateDirectory(logoFolder);

                                var logoFilePath = Path.Combine(logoFolder, "logo" + fileExt);

                                // Resize image to 300x300 maintaining aspect ratio
                                using (var inputStream = new MemoryStream(bytes))
                                using (var image = System.Drawing.Image.FromStream(inputStream))
                                {
                                    int targetSize = 300;
                                    int width, height;
                                    if (image.Width > image.Height)
                                    {
                                        width = targetSize;
                                        height = (int)(image.Height * (targetSize / (double)image.Width));
                                    }
                                    else
                                    {
                                        height = targetSize;
                                        width = (int)(image.Width * (targetSize / (double)image.Height));
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
                                            bmp.Save(logoFilePath, System.Drawing.Imaging.ImageFormat.Png);
                                        else
                                            bmp.Save(logoFilePath, System.Drawing.Imaging.ImageFormat.Jpeg);
                                    }
                                }

                                // Set the logo path relative to wwwroot and prepend host url
                                uw.VisitingCardDetail.Logo = $"{hostUrl}/drive/uwpics/{uw.Id}/logo{fileExt}";

                                // Optionally, delete the other format if it exists
                                if (fileExt == ".png" && System.IO.File.Exists(logoJpgPath))
                                    System.IO.File.Delete(logoJpgPath);
                                if (fileExt == ".jpg" && System.IO.File.Exists(logoPngPath))
                                    System.IO.File.Delete(logoPngPath);
                            }
                        }
                        catch (Exception fileEx)
                        {
                            logger.LogWarning(fileEx, "Failed to save or resize logo file for website {WebsiteId}", uw.Id);
                        }
                    }
                    else if (!string.IsNullOrWhiteSpace(model.Logo))
                    {
                        // If model.Logo is a URL or path, just set it
                        uw.VisitingCardDetail.Logo = model.Logo;
                    }

                    // Update other fields as before
                    uw.VisitingCardDetail.Company = string.IsNullOrWhiteSpace(model.Company) ? string.Empty : model.Company;
                    uw.VisitingCardDetail.TagLine = string.IsNullOrWhiteSpace(model.TagLine) ? string.Empty : model.TagLine;
                    uw.VisitingCardDetail.Keywords = string.IsNullOrWhiteSpace(model.Keywords) ? string.Empty : model.Keywords;
                    uw.VisitingCardDetail.PersonName = string.IsNullOrWhiteSpace(model.PersonName) ? string.Empty : model.PersonName;
                    uw.VisitingCardDetail.Designation = string.IsNullOrWhiteSpace(model.Designation) ? string.Empty : model.Designation;
                    uw.VisitingCardDetail.WhatsApp = string.IsNullOrWhiteSpace(model.WhatsApp) ? string.Empty : model.WhatsApp;
                    uw.VisitingCardDetail.Telegram = string.IsNullOrWhiteSpace(model.Telegram) ? string.Empty : model.Telegram;
                    uw.VisitingCardDetail.Youtube = string.IsNullOrWhiteSpace(model.Youtube) ? string.Empty : model.Youtube;
                    uw.VisitingCardDetail.Instagram = string.IsNullOrWhiteSpace(model.Instagram) ? string.Empty : model.Instagram;
                    uw.VisitingCardDetail.LinkedIn = string.IsNullOrWhiteSpace(model.LinkedIn) ? string.Empty : model.LinkedIn;
                    uw.VisitingCardDetail.Twitter = string.IsNullOrWhiteSpace(model.Twitter) ? string.Empty : model.Twitter;
                    uw.VisitingCardDetail.Facebook = string.IsNullOrWhiteSpace(model.Facebook) ? string.Empty : model.Facebook;
                    uw.VisitingCardDetail.Email = string.IsNullOrWhiteSpace(model.Email) ? string.Empty : model.Email;
                    uw.VisitingCardDetail.Phone1 = string.IsNullOrWhiteSpace(model.Phone1) ? string.Empty : model.Phone1;
                    uw.VisitingCardDetail.Phone2 = string.IsNullOrWhiteSpace(model.Phone2) ? string.Empty : model.Phone2;
                    uw.VisitingCardDetail.Phone3 = string.IsNullOrWhiteSpace(model.Phone3) ? string.Empty : model.Phone3;
                    uw.VisitingCardDetail.Address = string.IsNullOrWhiteSpace(model.Address) ? string.Empty : model.Address;
                    uw.VisitingCardDetail.AboutInfo = string.IsNullOrWhiteSpace(model.AboutInfo) ? string.Empty : model.AboutInfo;
                    uw.VisitingCardDetail.Photos = [];

                    uw.Modified = DateTime.UtcNow;
                    uw.JsonData = JsonSerializer.Serialize(uw.VisitingCardDetail);
                    db.UserWebsites.Update(uw);
                    db.SaveChanges();

                    return Ok(uw);
                }
                return NotFound(new { error = "Visiting card details are not available." });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating user Visiting Card");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("updatetheme")]
        public IActionResult UpdateTheme([FromBody] UpdateThemeModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var member = db.Members.FirstOrDefault(d => d.Email == email);
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                var website = db.UserWebsites.Include(t => t.Owner)
                    .FirstOrDefault(t => t.Id == model.WebsiteId && t.Owner.ID == member.ID);

                if (website == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });

                var theme = db.UserWebsiteThemes.FirstOrDefault(t => t.Id == model.ThemeId);
                if (theme == null)
                    return BadRequest(new { error = "Theme not found." });

                website.ThemeId = theme.Id;
                website.Html = theme.Html;
                website.Modified = DateTime.UtcNow;

                db.UserWebsites.Update(website);
                db.SaveChanges();

                return Ok(website);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet]
        [Route("updatestatus/{id}")]
        public IActionResult UpdateStatus(Guid id,[FromQuery] RecordStatus status)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var member = db.Members.FirstOrDefault(d => d.Email == email);
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                var website = db.UserWebsites.Include(t => t.Owner)
                    .FirstOrDefault(t => t.Id ==id && t.Owner.ID == member.ID);

                if (website == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });

                website.Status = status;
                website.Modified = DateTime.UtcNow;

                db.UserWebsites.Update(website);
                db.SaveChanges();

                return Ok(website);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating website status");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpGet]
        [Route("html/{id}")]
        public async Task<IActionResult> GetHtml(Guid id)
        {
            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var member = db.Members.FirstOrDefault(d => d.Email == email);
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                var website = db.UserWebsites.Include(t => t.Owner)
                    .FirstOrDefault(t => t.Id == id);

                if (website == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });
                if(website.WSType == WebsiteType.VCard && !string.IsNullOrWhiteSpace(website.JsonData))
                {
                    try
                    {
                        website.VisitingCardDetail = JsonSerializer.Deserialize<VisitingCardDetail>(website.JsonData) ?? new VisitingCardDetail();
                        string html = await userWebsite.GetRenderedHtmlAsync(website.Html, website.VisitingCardDetail);
                        return Ok(new { html });
                    }
                    catch (JsonException jsonEx)
                    {
                        logger.LogError(jsonEx, "Error deserializing VisitingCardDetail for website {WebsiteId}", id);
                        return BadRequest(new { error = "Invalid data format for Visiting Card details." });
                    }
                }
                else if (website.WSType == WebsiteType.LinkList && !string.IsNullOrWhiteSpace(website.JsonData))
                {
                    try
                    {
                        website.LinkListDetail = JsonSerializer.Deserialize<LinkListDetail>(website.JsonData) ?? new LinkListDetail();
                        string html = await userWebsite.GetRenderedHtmlAsync(website.Html, website.LinkListDetail);
                        return Ok(new { html });
                    }
                    catch (JsonException jsonEx)
                    {
                        logger.LogError(jsonEx, "Error deserializing LinkListDetail for website {WebsiteId}", id);
                        return BadRequest(new { error = "Invalid data format for LinkList details." });
                    }
                }

                return BadRequest(new { error = "Only visiting card and link list websites are supported at present." });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating website theme");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("createlinklist")]
        public IActionResult CreateLinkList([FromBody] CreateLinkListWebsiteDTO model)
        {
            try
            {
                // Check for duplicate website name
                if (db.UserWebsites.Any(t => t.Name == model.WebsiteName))
                    return BadRequest(new { error = "Website name already exists." });

                // Validate theme
                var theme = db.UserWebsiteThemes.FirstOrDefault(t => t.Id == model.ThemeId);
                if (theme == null)
                    return BadRequest(new { error = "Theme not found." });

                // Extract email from user claims
                var emailClaim = User.Claims.FirstOrDefault(t => t.Type == ClaimTypes.Email);
                if (emailClaim == null)
                    return Unauthorized(new { error = "Email claim missing." });

                var member = db.Members.FirstOrDefault(d => d.Email == emailClaim.Value);
                if (member == null)
                    return Unauthorized(new { error = "User not registered." });

                // Generate the website ID first so it can be used for the folder
                var websiteId = Guid.NewGuid();

                // Get host url (scheme + host + port if present)
                var request = HttpContext.Request;
                var hostUrl = $"{request.Scheme}://{request.Host.Value}";

                // Handle Photo: save as PNG/JPG, max 300x300, maintain aspect ratio
                string photoPath = string.Empty;
                if (!string.IsNullOrWhiteSpace(model.Photo) && model.Photo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var base64Data = model.Photo;
                        string fileExt = ".png";
                        if (base64Data.StartsWith("data:image/png"))
                            fileExt = ".png";
                        else if (base64Data.StartsWith("data:image/jpeg") || base64Data.StartsWith("data:image/jpg"))
                            fileExt = ".jpg";

                        var base64Parts = base64Data.Split(',');
                        if (base64Parts.Length == 2)
                        {
                            var bytes = Convert.FromBase64String(base64Parts[1]);
                            var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                            var photoFolder = Path.Combine(webRootPath, "drive", "uwpics", websiteId.ToString());
                            if (!Directory.Exists(photoFolder))
                                Directory.CreateDirectory(photoFolder);

                            var photoFilePath = Path.Combine(photoFolder, "photo" + fileExt);

                            // Resize image to 300x300 maintaining aspect ratio
                            using (var inputStream = new MemoryStream(bytes))
                            using (var image = System.Drawing.Image.FromStream(inputStream))
                            {
                                int targetSize = 300;
                                int width, height;
                                if (image.Width > image.Height)
                                {
                                    width = targetSize;
                                    height = (int)(image.Height * (targetSize / (double)image.Width));
                                }
                                else
                                {
                                    height = targetSize;
                                    width = (int)(image.Width * (targetSize / (double)image.Height));
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
                                        bmp.Save(photoFilePath, System.Drawing.Imaging.ImageFormat.Png);
                                    else
                                        bmp.Save(photoFilePath, System.Drawing.Imaging.ImageFormat.Jpeg);
                                }
                            }

                            // Set the photo path relative to wwwroot
                            photoPath = $"{hostUrl}/drive/uwpics/{websiteId}/photo{fileExt}";
                        }
                    }
                    catch (Exception fileEx)
                    {
                        logger.LogWarning(fileEx, "Failed to save or resize photo for LinkList website");
                    }
                }
                else if (!string.IsNullOrWhiteSpace(model.Photo))
                {
                    // If Photo is a URL or path, just set it
                    photoPath = model.Photo;
                }

                // Assemble LinkList details
                var linkListDetail = new LinkListDetail
                {
                    Name = model.Name,
                    Line = model.Line,
                    Photo = photoPath,
                    Links = model.Links ?? [],
                    Youtube = model.Youtube,
                    Instagram = model.Instagram,
                    LinkedIn = model.LinkedIn,
                    Twitter = model.Twitter,
                    Facebook = model.Facebook,
                    Telegram = model.Telegram,
                    WhatsApp = model.WhatsApp
                };

                var userWebsite = new UserWebsite
                {
                    Id = websiteId,
                    Created = DateTime.UtcNow,
                    Name = model.WebsiteName,
                    Owner = member,
                    WSType = WebsiteType.LinkList,
                    Status = RecordStatus.Inactive,
                    ThemeId = theme.Id,
                    Html = theme.Html,
                    LinkListDetail = linkListDetail,
                    JsonData = System.Text.Json.JsonSerializer.Serialize(linkListDetail)
                };

                db.UserWebsites.Add(userWebsite);
                db.SaveChanges();

                return Ok(userWebsite);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating LinkList website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        [HttpPost]
        [Route("updatelinklist")]
        public IActionResult UpdateLinkList([FromBody] UpdateLinkListModel model)
        {
            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var member = db.Members.FirstOrDefault(d => d.Email == email);
                if (member == null)
                    return Unauthorized(new { error = "User not found." });

                var uw = db.UserWebsites
                    .Include(t => t.Owner)
                    .FirstOrDefault(t => t.Id == model.Id && t.Owner.ID == member.ID);

                if (uw == null)
                    return NotFound(new { error = "Website not found or you do not have permission to update it." });

                if (uw.WSType == WebsiteType.LinkList)
                {
                    // Deserialize existing data if present
                    if (!string.IsNullOrWhiteSpace(uw.JsonData))
                    {
                        try
                        {
                            uw.LinkListDetail = JsonSerializer.Deserialize<LinkListDetail>(uw.JsonData) ?? new LinkListDetail();
                        }
                        catch (JsonException jsonEx)
                        {
                            logger.LogError(jsonEx, "Error deserializing LinkListDetail for website {WebsiteId}", uw.Id);
                            uw.LinkListDetail = new LinkListDetail(); // Reset to default if deserialization fails
                        }
                    }
                    else
                    {
                        uw.LinkListDetail = new LinkListDetail();
                    }
                    // Get host url (scheme + host + port if present)
                    var request = HttpContext.Request;
                    var hostUrl = $"{request.Scheme}://{request.Host.Value}";

                    // Handle Photo upload
                    string photoPath = uw.LinkListDetail.Photo ?? string.Empty;
                    var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var photoFolder = Path.Combine(webRootPath, "drive", "uwpics", uw.Id.ToString());
                    var photoPngPath = Path.Combine(photoFolder, "photo.png");
                    var photoJpgPath = Path.Combine(photoFolder, "photo.jpg");

                    if (string.IsNullOrWhiteSpace(model.Photo))
                    {
                        // If model.Photo is empty and DB has a photo, delete the file and clear the field
                        try
                        {
                            if (System.IO.File.Exists(photoPngPath))
                                System.IO.File.Delete(photoPngPath);
                            if (System.IO.File.Exists(photoJpgPath))
                                System.IO.File.Delete(photoJpgPath);
                        }
                        catch (Exception fileEx)
                        {
                            logger.LogWarning(fileEx, "Failed to delete photo file for website {WebsiteId}", uw.Id);
                        }
                        photoPath = string.Empty;
                    }
                    else if (model.Photo.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            var base64Data = model.Photo;
                            string fileExt = ".png";
                            if (base64Data.StartsWith("data:image/png"))
                                fileExt = ".png";
                            else if (base64Data.StartsWith("data:image/jpeg") || base64Data.StartsWith("data:image/jpg"))
                                fileExt = ".jpg";

                            var base64Parts = base64Data.Split(',');
                            if (base64Parts.Length == 2)
                            {
                                var bytes = Convert.FromBase64String(base64Parts[1]);
                                if (!Directory.Exists(photoFolder))
                                    Directory.CreateDirectory(photoFolder);

                                var photoFilePath = Path.Combine(photoFolder, "photo" + fileExt);

                                // Resize image to 300x300 maintaining aspect ratio
                                using (var inputStream = new MemoryStream(bytes))
                                using (var image = System.Drawing.Image.FromStream(inputStream))
                                {
                                    int targetSize = 300;
                                    int width, height;
                                    if (image.Width > image.Height)
                                    {
                                        width = targetSize;
                                        height = (int)(image.Height * (targetSize / (double)image.Width));
                                    }
                                    else
                                    {
                                        height = targetSize;
                                        width = (int)(image.Width * (targetSize / (double)image.Height));
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
                                            bmp.Save(photoFilePath, System.Drawing.Imaging.ImageFormat.Png);
                                        else
                                            bmp.Save(photoFilePath, System.Drawing.Imaging.ImageFormat.Jpeg);
                                    }
                                }

                                // Set the photo path relative to wwwroot
                                photoPath = $"{hostUrl}/drive/uwpics/{uw.Id}/photo{fileExt}";

                                // Optionally, delete the other format if it exists
                                if (fileExt == ".png" && System.IO.File.Exists(photoJpgPath))
                                    System.IO.File.Delete(photoJpgPath);
                                if (fileExt == ".jpg" && System.IO.File.Exists(photoPngPath))
                                    System.IO.File.Delete(photoPngPath);
                            }
                        }
                        catch (Exception fileEx)
                        {
                            logger.LogWarning(fileEx, "Failed to save or resize photo for LinkList website {WebsiteId}", uw.Id);
                        }
                    }
                    else
                    {
                        // If model.Photo is a URL or path, just set it
                        photoPath = model.Photo;
                    }

                    // Update properties
                    uw.LinkListDetail.Name = model.Name ?? string.Empty;
                    uw.LinkListDetail.Line = model.Line ?? string.Empty;
                    uw.LinkListDetail.Photo = photoPath;
                    uw.LinkListDetail.Links = model.Links ?? [];
                    uw.LinkListDetail.Youtube = model.Youtube ?? string.Empty;
                    uw.LinkListDetail.Instagram = model.Instagram ?? string.Empty;
                    uw.LinkListDetail.LinkedIn = model.LinkedIn ?? string.Empty;
                    uw.LinkListDetail.Twitter = model.Twitter ?? string.Empty;
                    uw.LinkListDetail.Facebook = model.Facebook ?? string.Empty;
                    uw.LinkListDetail.Telegram = model.Telegram ?? string.Empty;
                    uw.LinkListDetail.WhatsApp = model.WhatsApp ?? string.Empty;

                    uw.Modified = DateTime.UtcNow;
                    uw.JsonData = JsonSerializer.Serialize(uw.LinkListDetail);
                    db.UserWebsites.Update(uw);
                    db.SaveChanges();

                    return Ok(uw);
                }
                return NotFound(new { error = "LinkList details are not available." });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating LinkList website");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }
    }
}

