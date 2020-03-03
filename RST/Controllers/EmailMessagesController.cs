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

namespace RST.Controllers
{
    [Authorize(Roles ="Admin,Demo")]
    public class EmailMessagesController : ApiController
    {
        private RSTContext db = new RSTContext();

        // GET: api/EmailMessages
        public EmailMessageListDTO GetEmailMessages([FromUri]int pagenumber, [FromUri]int pagesize)
        {
            EmailMessageListDTO result = new EmailMessageListDTO();
            result.CurrentPage = pagenumber;
            result.Messages.AddRange(db.EmailMessages.OrderByDescending(t => t.CreateDate).Skip(pagenumber * pagesize).Take(pagesize));
            result.TotalPages =(int)Math.Ceiling((double)(db.EmailMessages.Count() / pagesize));
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