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
            CustomDataSource customDataSource = db.CustomDataSources.Find(id);
            if (customDataSource == null)
            {
                return NotFound();
            }

            return Ok(customDataSource);
        }

        // PUT: api/CustomDataSources/5
        [ResponseType(typeof(void))]
        public IHttpActionResult PutCustomDataSource(int id, CustomDataSource customDataSource)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != customDataSource.ID)
            {
                return BadRequest();
            }

            db.Entry(customDataSource).State = EntityState.Modified;

            try
            {
                db.SaveChanges();
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

            return StatusCode(HttpStatusCode.NoContent);
        }

        // POST: api/CustomDataSources
        [ResponseType(typeof(CustomDataSource))]
        public IHttpActionResult PostCustomDataSource(CustomDataSource customDataSource)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            db.CustomDataSources.Add(customDataSource);
            db.SaveChanges();

            return CreatedAtRoute("DefaultApi", new { id = customDataSource.ID }, customDataSource);
        }

        // DELETE: api/CustomDataSources/5
        [ResponseType(typeof(CustomDataSource))]
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