using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO.UserWebsite;
using System.Security.Claims;
using System.Text.Json;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserWebsiteController(RSTContext context, ILogger<UserWebsiteController> _logger) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<UserWebsiteController> logger = _logger;

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
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

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
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

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

        //[HttpPost]
        //[Route("updatename/{id}")]
        //public IActionResult UpdateName(Guid id,[FromForm] string name)
        //{
        //    try
        //    {
        //        if(!string.IsNullOrEmpty(name))
        //            return BadRequest(new { error = "Name is required." });
        //        else if(name.Length > 250)
        //            return BadRequest(new { error = "Name cannot be longer than 250 characters." });

        //        var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
        //        var m = db.Members.First(d => d.Email == email);
        //        var uw = db.UserWebsites.Include(t => t.Owner).FirstOrDefault(t => t.Id == id && t.Owner.ID == m.ID);

        //        if(uw == null)
        //            return NotFound(new { error = "Website not found or you do not have permission to update it." });

        //        if(db.UserWebsites.Any(t => t.Name == name && t.Id != id))
        //            return BadRequest(new { error = "Website with this name already exists." });

        //        uw.Name = name;
        //        uw.Modified = DateTime.UtcNow;
        //        db.UserWebsites.Update(uw);
        //        db.SaveChanges();
        //        return Ok(uw);
        //    }
        //    catch (Exception ex)
        //    {
        //        logger.LogError(ex, "Error updating user website");
        //        return StatusCode(500, new { error = Utility.ServerErrorMessage });
        //    }
        //}

        [HttpPost]
        [Route("updatevcard")]
        public IActionResult UpdateVCard([FromBody] UpdateVCardModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);


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
    }
}
