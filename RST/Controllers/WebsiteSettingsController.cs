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
    public class WebsiteSettingsController : ApiController
    {
        private RSTContext db = new RSTContext();

        // GET: api/WebsiteSettings
        public List<WebsiteSetting> GetWebsiteSettings()
        {
            return db.WebsiteSettings.Where(t => t.KeyName != "UniversalPassword").ToList();
        }

        // GET: api/WebsiteSettings/5
        [ResponseType(typeof(WebsiteSetting))]
        public IHttpActionResult GetWebsiteSetting(string id)
        {
            WebsiteSetting websiteSetting = db.WebsiteSettings.Find(id);
            if (websiteSetting == null)
            {
                return NotFound();
            }

            return Ok(websiteSetting);
        }

        // PUT: api/WebsiteSettings/5
        [ResponseType(typeof(void))]
        [Authorize(Roles = "Admin")]
        public IHttpActionResult PutWebsiteSetting(string id, WebsiteSetting websiteSetting)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != websiteSetting.KeyName)
            {
                return BadRequest();
            }

            db.Entry(websiteSetting).State = EntityState.Modified;

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WebsiteSettingExists(id))
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

        // POST: api/WebsiteSettings
        [ResponseType(typeof(WebsiteSetting))]
        [Authorize(Roles = "Admin")]
        public IHttpActionResult PostWebsiteSetting(WebsiteSetting websiteSetting)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            db.WebsiteSettings.Add(websiteSetting);

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateException)
            {
                if (WebsiteSettingExists(websiteSetting.KeyName))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtRoute("DefaultApi", new { id = websiteSetting.KeyName }, websiteSetting);
        }

        // DELETE: api/WebsiteSettings/5
        [ResponseType(typeof(WebsiteSetting))]
        [Authorize(Roles = "Admin")]
        public IHttpActionResult DeleteWebsiteSetting(string id)
        {
            WebsiteSetting websiteSetting = db.WebsiteSettings.Find(id);
            if (websiteSetting == null)
            {
                return NotFound();
            }

            db.WebsiteSettings.Remove(websiteSetting);
            db.SaveChanges();

            return Ok(websiteSetting);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool WebsiteSettingExists(string id)
        {
            return db.WebsiteSettings.Count(e => e.KeyName == id) > 0;
        }
    }
}