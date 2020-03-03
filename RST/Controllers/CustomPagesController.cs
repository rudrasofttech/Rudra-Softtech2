using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
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
        public IHttpActionResult PutCustomPage(int id, CustomPage customPage)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != customPage.ID)
            {
                return BadRequest();
            }

            db.Entry(customPage).State = EntityState.Modified;

            try
            {
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
        public IHttpActionResult PostCustomPage(CustomPage customPage)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            db.CustomPages.Add(customPage);
            db.SaveChanges();

            return CreatedAtRoute("DefaultApi", new { id = customPage.ID }, customPage);
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