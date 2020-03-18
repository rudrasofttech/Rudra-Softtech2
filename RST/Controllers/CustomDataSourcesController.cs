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
    [Authorize(Roles = "Admin,Demo")]
    public class CustomDataSourcesController : ApiController
    {
        private RSTContext db = new RSTContext();

        // GET: api/CustomDataSources
        public List<CustomDataSourceDTO> GetCustomDataSources()
        {
            List<CustomDataSourceDTO> result = db.CustomDataSources.Select(m => new CustomDataSourceDTO()
            {
                ID = m.ID,
                Query = m.Query,
                HtmlTemplate = m.HtmlTemplate,
                CreatedBy = m.CreatedBy.ID,
                CreatedByName = m.CreatedBy.FirstName,
                DateCreated = m.DateCreated,
                DateModified = m.DateModified,
                ModifiedBy = (m.ModifiedBy == null) ? 0 : m.ModifiedBy.ID,
                Name = m.Name,
                ModifiedByName = (m.ModifiedBy == null) ? "" : m.ModifiedBy.FirstName
            }).ToList();

            return result;
        }

        // GET: api/CustomDataSources/5
        [ResponseType(typeof(CustomDataSource))]
        public IHttpActionResult GetCustomDataSource(int id)
        {
            if (id == 0)
            {
                return Ok(new CustomDataSource());
            }
            CustomDataSource customDataSource = db.CustomDataSources.Find(id);
            if (customDataSource == null)
            {
                return NotFound();
            }

            return Ok(customDataSource);
        }

        // PUT: api/CustomDataSources/5
        [ResponseType(typeof(void))]
        [Authorize(Roles = "Admin")]
        public IHttpActionResult PutCustomDataSource(int id, [FromBody]CustomDataSource ds)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(ds.Name) || string.IsNullOrEmpty(ds.HtmlTemplate))
            {
                return BadRequest("Either name or html template is missing");
            }

            try
            {
                CustomDataSource cds = db.CustomDataSources.FirstOrDefault(t => t.ID == id);
                if (cds != null)
                {
                    cds.HtmlTemplate = ds.HtmlTemplate;
                    cds.Name = ds.Name;
                    cds.Query = ds.Query;
                    cds.ModifiedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
                    cds.DateModified = DateTime.Now;
                    db.Entry(cds).State = EntityState.Modified;
                    db.SaveChanges();
                }
                else
                {
                    return BadRequest("Unable to find data source with this id.");
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomDataSourceExists(id))
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

        // POST: api/CustomDataSources
        [ResponseType(typeof(CustomDataSource))]
        [Authorize(Roles = "Admin")]
        public IHttpActionResult PostCustomDataSource([FromBody]CustomDataSource ds)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (db.CustomDataSources.Count(t => t.Name.Trim() == ds.Name.Trim()) == 0)
            {
                CustomDataSource cds = new CustomDataSource()
                {
                    CreatedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name),
                    DateCreated = DateTime.Now,
                    HtmlTemplate = ds.HtmlTemplate,
                    Name = ds.Name,
                    Query = ds.Query
                };
                db.CustomDataSources.Add(cds);
                db.SaveChanges();
                return CreatedAtRoute("DefaultApi", new { id = cds.ID }, cds);
            }
            else
            {
                return BadRequest("Data source with same name exist.");
            }
        }

        // DELETE: api/CustomDataSources/5
        [ResponseType(typeof(CustomDataSource))]
        [Authorize(Roles = "Admin")]
        public IHttpActionResult DeleteCustomDataSource(int id)
        {
            CustomDataSource customDataSource = db.CustomDataSources.Find(id);
            if (customDataSource == null)
            {
                return NotFound();
            }

            db.CustomDataSources.Remove(customDataSource);
            db.SaveChanges();

            return Ok(customDataSource);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool CustomDataSourceExists(int id)
        {
            return db.CustomDataSources.Count(e => e.ID == id) > 0;
        }
    }
}