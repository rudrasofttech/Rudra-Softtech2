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
    public class TopStoriesController : ApiController
    {
        private RSTContext db = new RSTContext();

        // GET: api/TopStories
        public IQueryable<TopStory> GetTopStories()
        {
            return db.TopStories;
        }

        // GET: api/TopStories/5
        [ResponseType(typeof(TopStory))]
        public IHttpActionResult GetTopStory(int id)
        {
            TopStory topStory = db.TopStories.Find(id);
            if (topStory == null)
            {
                return NotFound();
            }

            return Ok(topStory);
        }

        // PUT: api/TopStories/5
        [ResponseType(typeof(void))]
        public IHttpActionResult PutTopStory(int id, TopStory topStory)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != topStory.ID)
            {
                return BadRequest();
            }

            db.Entry(topStory).State = EntityState.Modified;

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TopStoryExists(id))
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

        // POST: api/TopStories
        [ResponseType(typeof(TopStory))]
        public IHttpActionResult PostTopStory(TopStory topStory)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            db.TopStories.Add(topStory);
            db.SaveChanges();

            return CreatedAtRoute("DefaultApi", new { id = topStory.ID }, topStory);
        }

        // DELETE: api/TopStories/5
        [ResponseType(typeof(TopStory))]
        public IHttpActionResult DeleteTopStory(int id)
        {
            TopStory topStory = db.TopStories.Find(id);
            if (topStory == null)
            {
                return NotFound();
            }

            db.TopStories.Remove(topStory);
            db.SaveChanges();

            return Ok(topStory);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool TopStoryExists(int id)
        {
            return db.TopStories.Count(e => e.ID == id) > 0;
        }
    }
}