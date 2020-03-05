using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Web.Http;
using System.Web.Http.Cors;
using System.Web.Http.Description;
using RST.Data;
using RST.Models;

namespace RST.Controllers
{
    [Authorize(Roles = "Admin,Demo")]
    public class CustomPagesController : ApiController
    {
        private RSTContext db = new RSTContext();

        // GET: api/CustomPages
        public List<CustomPageDTO> GetCustomPages()
        {
            List<CustomPageDTO> result = db.CustomPages.Select(m => new CustomPageDTO()
            {
                ID = m.ID,
                Body = m.Body,
                CreatedBy = m.CreatedBy.ID,
                Title = m.Title,
                Status = m.Status.ToString(),
                CreatedByName = m.CreatedBy.FirstName,
                DateCreated = m.DateCreated,
                DateModified = m.DateModified,
                Head = m.Head,
                ModifiedBy = (m.ModifiedBy == null) ? 0 : m.ModifiedBy.ID,
                Name = m.Name,
                NoTemplate = m.NoTemplate,
                PageMeta = m.PageMeta,
                Sitemap = m.Sitemap,
                ModifiedByName = (m.ModifiedBy == null) ? "" : m.ModifiedBy.FirstName
            }).ToList();

            return result;
        }

        // GET: api/CustomPages/5
        [ResponseType(typeof(CustomPage))]
        public IHttpActionResult GetCustomPage(int id)
        {
            CustomPage customPage = db.CustomPages.Find(id);
            if (customPage == null)
            {
                return NotFound();
            }

            return Ok(customPage);
        }

        // PUT: api/CustomPages/5
        [ResponseType(typeof(void))]
        public IHttpActionResult PutCustomPage(int id, [FromBody] string Name, [FromBody]PostStatus Status, [FromBody]bool Sitemap,
            [FromBody]string Body, [FromBody]string Head, [FromBody]bool NoTemplate, [FromBody]string PageMeta, [FromBody] string Title)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(Name) || string.IsNullOrEmpty(Body) || string.IsNullOrEmpty(Title))
            {
                return BadRequest("Either name or body or title is missing.");
            }

            try
            {
                CustomPage cp = db.CustomPages.FirstOrDefault(t => t.ID == id);
                cp.Head = Head;
                cp.Name = Name;
                cp.NoTemplate = NoTemplate;
                cp.PageMeta = PageMeta;
                cp.Sitemap = Sitemap;
                cp.Status = Status;
                cp.Title = Title;
                cp.Body = Body;
                cp.DateModified = DateTime.Now;
                cp.ModifiedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
                db.Entry(cp).State = EntityState.Modified;
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomPageExists(id))
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

        // POST: api/CustomPages
        [ResponseType(typeof(CustomPage))]
        public IHttpActionResult PostCustomPage([FromBody] string Name, [FromBody]PostStatus Status, [FromBody]bool Sitemap,
            [FromBody]string Body, [FromBody]string Head, [FromBody]bool NoTemplate, [FromBody]string PageMeta, [FromBody] string Title)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(Name) || string.IsNullOrEmpty(Body) || string.IsNullOrEmpty(Title))
            {
                return BadRequest("Either name or body or title is missing.");
            }
            if (db.CustomPages.Count(t => t.Name.Trim() == Name.Trim()) == 0)
            {
                CustomPage cp = new CustomPage()
                {
                    Body = Body,
                    CreatedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name),
                    DateCreated = DateTime.Now,
                    Head = Head,
                    Name = Name,
                    NoTemplate = NoTemplate,
                    PageMeta = PageMeta,
                    Sitemap = Sitemap,
                    Status = Status,
                    Title = Title
                };
                db.CustomPages.Add(cp);
                db.SaveChanges();

                return CreatedAtRoute("DefaultApi", new { id = cp.ID }, cp);
            }
            else {
                return BadRequest("Page with same name exist.");
            }
        }

        // DELETE: api/CustomPages/5
        [ResponseType(typeof(CustomPage))]
        public IHttpActionResult DeleteCustomPage(int id)
        {
            CustomPage customPage = db.CustomPages.Find(id);
            if (customPage == null)
            {
                return NotFound();
            }

            db.CustomPages.Remove(customPage);
            db.SaveChanges();

            return Ok(customPage);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool CustomPageExists(int id)
        {
            return db.CustomPages.Count(e => e.ID == id) > 0;
        }
    }
}