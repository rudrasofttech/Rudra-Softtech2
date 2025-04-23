using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO;
using RST.Web.Service;
using System.Net;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmailMessagesController(RSTContext context, WebsiteSettingsService wsService, IWebHostEnvironment environment) : ControllerBase
    {
        private readonly IWebHostEnvironment _environment = environment;
        private readonly RSTContext db = context;
        private readonly WebsiteSettingsService _wsService = wsService;

        [Route("emailgroups")]
        [HttpGet]
        public IActionResult GetEmailGroups()
        {
            try
            {
                return Ok(db.EmailMessages.Select(t => new { EmailGroup = t.EmailGroup }).Distinct().ToList());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to email groups.", exception = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [Route("sendnewsletter")]
        [HttpPost]
        public IActionResult SendNewsletter([FromBody] SendNewsletterDTO dto)
        {

            if (string.IsNullOrEmpty(dto.EmailGroup) || string.IsNullOrEmpty(dto.Subject))
            {
                return BadRequest(new { error = "Either email group or subject is missing." });
            }
            try
            {
                var rs = db.WebsiteSettings.FirstOrDefault(t => t.KeyName == "NewsletterDesign");
                int count = 0;
                List<Member> list = [.. db.Members];
                string newsletteremail = _wsService.NewsletterEmail;
                string sitename = _wsService.SiteName;
                string sitetitle = _wsService.SiteTitle;
                string siteurl = _wsService.SiteURL;
                string emailSignature = _wsService.GetSiteSetting("EmailSignature");
                foreach (Member m in list)
                {
                    if (m.Newsletter)
                    {
                        var em = new EmailMessage();
                        em.CCAddress = string.Empty;
                        em.CreateDate = DateTime.UtcNow;
                        em.SentDate = DateTime.UtcNow;
                        em.EmailGroup = dto.EmailGroup.Trim();
                        em.EmailType = EmailMessageType.Newsletter;
                        em.FromAddress = newsletteremail;
                        em.FromName = sitename;
                        em.LastAttempt = DateTime.UtcNow;
                        em.Subject = dto.Subject.Trim();
                        em.ToAddress = m.Email;
                        em.ToName = m.FirstName;
                        em.Message = rs.KeyValue;
                        em.PublicID = Guid.NewGuid();
                        string emessage = $"{_environment.WebRootPath}/EmailWrapper.html";
                        emessage = emessage.Replace("[root]", siteurl);
                        emessage = emessage.Replace("[id]", em.ID.ToString());
                        emessage = emessage.Replace("[newsletteremail]", newsletteremail);
                        emessage = emessage.Replace("[message]", em.Message);
                        emessage = emessage.Replace("[toaddress]", em.ToAddress);
                        emessage = emessage.Replace("[sitename]", sitename);
                        emessage = emessage.Replace("[sitetitle]", sitetitle);
                        emessage = emessage.Replace("[emailsignature]", emailSignature);
                        em.Message = emessage;

                        db.EmailMessages.Add(em);
                        db.SaveChanges();
                        count++;
                    }
                }
                return Ok(count);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to send emails.", exception = ex.Message });
            }
        }

        [HttpGet]
        // GET: api/EmailMessages
        public IActionResult Get(int page = 1, int psize = 20,
             string etype = "", string group = "", string sent = "", string read = "")
        {
            try
            {
                var result = new PagedData<EmailMessage>() { PageSize = psize, PageIndex = page };

                var query = db.EmailMessages.Where(t => true);
                if (!string.IsNullOrEmpty(etype))
                {
                    EmailMessageType t;
                    if (Enum.TryParse<EmailMessageType>(etype, out t))
                    {
                        query = query.Where(o => o.EmailType == t);
                    }
                }
                if (!string.IsNullOrEmpty(group))
                {
                    query = query.Where(o => o.EmailGroup == group);
                }

                if (sent == "yes")
                {
                    query = query.Where(o => o.IsSent);
                }
                if (sent == "no")
                {
                    query = query.Where(o => !o.IsSent);
                }
                if (read == "yes")
                {
                    query = query.Where(o => o.IsRead);
                }
                if (read == "no")
                {
                    query = query.Where(o => !o.IsRead);
                }
                query = query.OrderByDescending(m => m.CreateDate);

                result.TotalRecords = query.Count();
                result.Items.AddRange(query.Skip((page - 1) * psize).Take(psize));

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to load email messages.", exception = ex.Message });
            }
        }

        [HttpGet("{id}")]
        // GET: api/EmailMessages/5
        public IActionResult Get(int id)
        {
            try { 
            var emailMessage = db.EmailMessages.FirstOrDefault(t => t.ID == id);
            if (emailMessage == null)
            {
                return NotFound();
            }

            return Ok(emailMessage);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to load email message.", exception = ex.Message });
            }
        }

        
        // DELETE: api/EmailMessages/5
        [HttpGet]
        [Route("delete/{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                var emailMessage = db.EmailMessages.FirstOrDefault(t => t.ID == id);
                if (emailMessage == null)
                {
                    return NotFound();
                }

                db.EmailMessages.Remove(emailMessage);
                db.SaveChanges();

                return Ok(emailMessage);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to delete email message.", exception = ex.Message });
            }
        }
    }
}
