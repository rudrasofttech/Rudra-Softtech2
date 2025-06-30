using Microsoft.AspNetCore.Http;
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
    public class UserWebsiteController(RSTContext context, ILogger<UserWebsiteController> _logger) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<UserWebsiteController> logger = _logger;

        private bool CheckRole(string roles)
        {
            return User.Claims.Any(t => t.Type == ClaimTypes.Role && roles.Contains(t.Value));
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

                var query = db.UserWebsites.OrderBy(t => t.Created).Skip((page - 1) * psize).Take(psize);

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

        public IActionResult Get(Guid id)
        {
            try
            {
                var result = db.UserWebsites.Include(t => t.Owner).Where(t => t.Id == id).Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.Created,
                    t.Status,
                    t.Domain,
                    t.Owner
                }).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching user websites");
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

                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var m = db.Members.First(d => d.Email == email);
                var uw = new UserWebsite()
                {
                    Created = DateTime.UtcNow,
                    Name = model.Name,
                    Owner = m,
                    Status = RecordStatus.Inactive,
                    WSType = model.WSType
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
                if (uw.WSType == WebsiteType.VCard && uw.VisitingCardDetail != null)
                {
                    if (model.FieldName == "title")
                    {
                        if (model.FieldValue.Length > 50)
                            return BadRequest(new { error = "Title cannot be longer than 50 characters." });

                        uw.VisitingCardDetail.Title = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "tagline")
                    {
                        if (model.FieldValue.Length > 100)
                            return BadRequest(new { error = "Tagline cannot be longer than 100 characters." });

                        uw.VisitingCardDetail.TagLine = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "keywords")
                    {
                        if (model.FieldValue.Length > 200)
                            return BadRequest(new { error = "Keywords cannot be longer than 200 characters." });

                        uw.VisitingCardDetail.Keywords = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "name")
                    {
                        if (model.FieldValue.Length > 80)
                            return BadRequest(new { error = "Name cannot be longer than 80 characters." });

                        uw.VisitingCardDetail.Name = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "designation")
                    {
                        if (model.FieldValue.Length > 50)
                            return BadRequest(new { error = "Designation cannot be longer than 50 characters." });

                        uw.VisitingCardDetail.Designation = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "whatsapp")
                    {
                        if (model.FieldValue.Length > 15)
                            return BadRequest(new { error = "WhatsApp cannot be longer than 15 characters." });

                        uw.VisitingCardDetail.WhatsApp = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "telegram")
                    {
                        if (model.FieldValue.Length > 50)
                            return BadRequest(new { error = "Telegram cannot be longer than 50 characters." });

                        uw.VisitingCardDetail.Telegram = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "youtube")
                    {
                        if (model.FieldValue.Length > 250)
                            return BadRequest(new { error = "Youtube cannot be longer than 250 characters." });

                        uw.VisitingCardDetail.Youtube = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "instagram")
                    {
                        if (model.FieldValue.Length > 250)
                            return BadRequest(new { error = "Instagram cannot be longer than 250 characters." });

                        uw.VisitingCardDetail.Instagram = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "linkedin")
                    {
                        if (model.FieldValue.Length > 250)
                            return BadRequest(new { error = "LinkedIn cannot be longer than 250 characters." });

                        uw.VisitingCardDetail.LinkedIn = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "facebook")
                    {
                        if (model.FieldValue.Length > 250)
                            return BadRequest(new { error = "Facebook cannot be longer than 250 characters." });

                        uw.VisitingCardDetail.Facebook = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "address")
                    {
                        if (model.FieldValue.Length > 400)
                            return BadRequest(new { error = "Address cannot be longer than 400 characters." });

                        uw.VisitingCardDetail.Address = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "aboutinfo")
                    {
                        if (model.FieldValue.Length > 400)
                            return BadRequest(new { error = "AboutInfo cannot be longer than 400 characters." });

                        uw.VisitingCardDetail.AboutInfo = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "logo")
                    {
                        uw.VisitingCardDetail.Logo = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "email")
                    {
                        if (model.FieldValue.Length > 150)
                            return BadRequest(new { error = "Email cannot be longer than 100 characters." });
                        uw.VisitingCardDetail.Email = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "phone1")
                    {
                        if (model.FieldValue.Length > 15)
                            return BadRequest(new { error = "Phone 1 cannot be longer than 15 characters." });
                        uw.VisitingCardDetail.Phone1 = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "phone2")
                    {
                        if (model.FieldValue.Length > 15)
                            return BadRequest(new { error = "Phone 2 cannot be longer than 15 characters." });
                        uw.VisitingCardDetail.Phone2 = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }
                    else if (model.FieldName == "phone3")
                    {
                        if (model.FieldValue.Length > 15)
                            return BadRequest(new { error = "Phone 3 cannot be longer than 15 characters." });
                        uw.VisitingCardDetail.Phone3 = string.IsNullOrEmpty(model.FieldValue) ? string.Empty : model.FieldValue;
                    }

                    uw.Modified = DateTime.UtcNow;
                    uw.JsonData = JsonSerializer.Serialize(uw);
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
    }
}
