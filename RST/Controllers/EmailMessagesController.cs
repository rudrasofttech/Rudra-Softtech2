using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;
using RST.Data;
using RST.Models;
using RST.Helper_Code;

namespace RST.Controllers
{
    [Authorize(Roles = "Admin,Demo")]
    public class EmailMessagesController : ApiController
    {
        private RSTContext db = new RSTContext();

        [Route("api/EmailMessages/EmailGroups")]
        [HttpGet]
        public IHttpActionResult GetEmailGroups()
        {
            return Ok(db.EmailMessages.Select(t => new { EmailGroup = t.EmailGroup }).Distinct().ToList());
        }

        [Authorize(Roles = "Admin")]
        [Route("api/EmailMessages/SendNewsletter")]
        [HttpPost]
        public IHttpActionResult SendNewsletter([FromBody]SendNewsletterDTO dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.EmailGroup) || string.IsNullOrEmpty(dto.Subject))
                {
                    return BadRequest("Either email group or subject is missing.");
                }
                WebsiteSetting rs = db.WebsiteSettings.Find("NewsletterDesign");
                int count = 0;
                List<Member> list = db.Members.ToList();
                foreach (Member m in list)
                {
                    if (m.Newsletter)
                    {
                        EmailMessage em = new EmailMessage();
                        em.CCAddress = string.Empty;
                        em.CreateDate = DateTime.Now;
                        em.SentDate = DateTime.Now;
                        em.EmailGroup = dto.EmailGroup.Trim();
                        em.EmailType = EmailMessageType.Newsletter;
                        em.FromAddress = Utility.NewsletterEmail;
                        em.FromName = Utility.SiteName;
                        em.LastAttempt = DateTime.Now;
                        em.Subject = dto.Subject.Trim();
                        em.ToAddress = m.Email;
                        em.ToName = m.FirstName;
                        em.Message = rs.KeyValue;
                        em.PublicID = Guid.NewGuid();
                        string emessage = System.Web.Hosting.HostingEnvironment.MapPath("~/EmailWrapper.html");
                        emessage = emessage.Replace("[root]", Utility.SiteURL);
                        emessage = emessage.Replace("[id]", em.ID.ToString());
                        emessage = emessage.Replace("[newsletteremail]", Utility.NewsletterEmail);
                        emessage = emessage.Replace("[message]", em.Message);
                        emessage = emessage.Replace("[toaddress]", em.ToAddress);
                        emessage = emessage.Replace("[sitename]", Utility.SiteName);
                        emessage = emessage.Replace("[sitetitle]", Utility.SiteTitle);
                        emessage = emessage.Replace("[emailsignature]", Utility.GetSiteSetting("EmailSignature"));
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
                throw ex;
            }

        }

        // GET: api/EmailMessages
        public EmailMessageListDTO GetEmailMessages([FromUri]int page = 1, [FromUri]int psize = 20,
            [FromUri]string etype = "", [FromUri] string group = "", [FromUri] string sent = "", [FromUri]string read = "")
        {
            
            EmailMessageListDTO result = new EmailMessageListDTO();
            
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
            int count = query.Count();
            result.TotalPages = count > psize ?  query.Count() / psize : 1;
            if(page > result.TotalPages)
            {
                page = (int)result.TotalPages;
            }else if(page < 1)
            {
                page = 1;
            }
            result.Page = page;
            result.Messages.AddRange(query.Skip((page - 1) * psize).Take(psize));
            
            return result;
        }

        // GET: api/EmailMessages/5
        [ResponseType(typeof(EmailMessage))]
        public IHttpActionResult GetEmailMessage(int id)
        {
            EmailMessage emailMessage = db.EmailMessages.Find(id);
            if (emailMessage == null)
            {
                return NotFound();
            }

            return Ok(emailMessage);
        }

        // PUT: api/EmailMessages/5
        [ResponseType(typeof(void))]
        public IHttpActionResult PutEmailMessage(int id, EmailMessage emailMessage)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != emailMessage.ID)
            {
                return BadRequest();
            }

            db.Entry(emailMessage).State = EntityState.Modified;

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EmailMessageExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return StatusCode(HttpStatusCode.NoContent);
        }

        // POST: api/EmailMessages
        [ResponseType(typeof(EmailMessage))]
        public IHttpActionResult PostEmailMessage(EmailMessage emailMessage)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            db.EmailMessages.Add(emailMessage);
            db.SaveChanges();

            return CreatedAtRoute("DefaultApi", new { id = emailMessage.ID }, emailMessage);
        }

        // DELETE: api/EmailMessages/5
        [ResponseType(typeof(EmailMessage))]
        public IHttpActionResult DeleteEmailMessage(int id)
        {
            EmailMessage emailMessage = db.EmailMessages.Find(id);
            if (emailMessage == null)
            {
                return NotFound();
            }

            db.EmailMessages.Remove(emailMessage);
            db.SaveChanges();

            return Ok(emailMessage);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool EmailMessageExists(int id)
        {
            return db.EmailMessages.Count(e => e.ID == id) > 0;
        }
    }
}