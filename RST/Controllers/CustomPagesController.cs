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
        [ResponseType(typeof(CustomPageDTO))]
        public IHttpActionResult GetCustomPage(int id)
        {
            if(id == 0)
            {
                return Ok(new CustomPageDTO());
            }
            CustomPage m = db.CustomPages.Find(id);
            if (m == null)
            {
                return NotFound();
            }
            CustomPageDTO result = new CustomPageDTO()
            {
                ID = m.ID,
                Body = m.Body,
                CreatedBy = (m.CreatedBy == null) ? 0 : m.CreatedBy.ID,
                Title = m.Title,
                Status = m.Status.ToString(),
                CreatedByName = (m.CreatedBy == null) ? "" : m.CreatedBy.FirstName,
                DateCreated = m.DateCreated,
                DateModified = m.DateModified,
                Head = m.Head,
                ModifiedBy = (m.ModifiedBy == null) ? 0 : m.ModifiedBy.ID,
                Name = m.Name,
                NoTemplate = m.NoTemplate,
                PageMeta = m.PageMeta,
                Sitemap = m.Sitemap,
                ModifiedByName = (m.ModifiedBy == null) ? "" : m.ModifiedBy.FirstName
            };


            return Ok(result);
        }

        // PUT: api/CustomPages/5
        [ResponseType(typeof(void))]
        public IHttpActionResult PutCustomPage(int id, [FromBody] CustomPageDTO page)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(page.Name) || string.IsNullOrEmpty(page.Body) || string.IsNullOrEmpty(page.Title))
            {
                return BadRequest("Either name or body or title is missing.");
            }

            try
            {
                CustomPage cp = db.CustomPages.FirstOrDefault(t => t.ID == id);
                cp.Head = page.Head;
                cp.Name = page.Name;
                cp.NoTemplate = page.NoTemplate;
                cp.PageMeta = page.PageMeta;
                cp.Sitemap = page.Sitemap;
                cp.Status = (PostStatus)Enum.Parse(typeof(PostStatus), page.Status);
                cp.Title = page.Title;
                cp.Body = page.Body;
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

            return Ok();
        }

        // POST: api/CustomPages
        [ResponseType(typeof(CustomPage))]
        public IHttpActionResult PostCustomPage([FromBody] CustomPageDTO page)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(page.Name) || string.IsNullOrEmpty(page.Body) || string.IsNullOrEmpty(page.Title))
            {
                return BadRequest("Either name or body or title is missing.");
            }
            if (db.CustomPages.Count(t => t.Name.Trim() == page.Name.Trim()) == 0)
            {
                CustomPage cp = new CustomPage()
                {
                    Body = page.Body,
                    CreatedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name),
                    DateCreated = DateTime.Now,
                    Head = page.Head,
                    Name = page.Name,
                    NoTemplate = page.NoTemplate,
                    PageMeta = page.PageMeta,
                    Sitemap = page.Sitemap,
                    Status = (PostStatus)Enum.Parse(typeof(PostStatus), page.Status),
                    Title = page.Title
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