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
    public class PostsController : ApiController
    {
        private RSTContext db = new RSTContext();

        // GET: api/Posts
        public List<PostDTO> GetPosts()
        {
            List<PostDTO> result = db.Posts.Select(m => new PostDTO()
            {
                ID = m.ID,
                CreatedBy = m.CreatedBy.ID,
                Title = m.Title,
                Status = m.Status.ToString(),
                CreatedByName = m.CreatedBy.FirstName,
                DateCreated = m.DateCreated,
                DateModified = m.DateModified,
                ModifiedBy = (m.ModifiedBy == null) ? 0 : m.ModifiedBy.ID,
                Sitemap = m.Sitemap,
                ModifiedByName = (m.ModifiedBy == null) ? "" : m.ModifiedBy.FirstName
            }).ToList();

            return result;
        }

        // GET: api/Posts/5
        [ResponseType(typeof(Post))]
        public IHttpActionResult GetPost(int id)
        {
            if (id == 0)
            {
                return Ok(new Post() { Category = new Category() { ID = 0, Name = "" } });
            }
            Post post = db.Posts.Include(c => c.Category).FirstOrDefault( t=> t.ID == id);
            if (post == null)
            {
                return NotFound();
            }

            return Ok(post);
        }

        // PUT: api/Posts/5
        [ResponseType(typeof(void))]
        [Authorize(Roles = "Admin")]
        public IHttpActionResult PutPost(int id, [FromBody]Post post)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(post.Title) || string.IsNullOrEmpty(post.Tag) || string.IsNullOrEmpty(post.Description)
                || string.IsNullOrEmpty(post.Article) || string.IsNullOrEmpty(post.WriterName) || string.IsNullOrEmpty(post.WriterEmail)
                || string.IsNullOrEmpty(post.URL))
            {
                return BadRequest("Required field missing.");
            }

            try
            {
                Post p = db.Posts.FirstOrDefault(t => t.ID == id && !(t.URL == post.URL && t.ID != id));
                if (p != null)
                {
                    p.Article = post.Article;
                    p.Category = db.Categories.FirstOrDefault(t => t.ID == post.Category.ID);
                    p.ModifiedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
                    p.DateModified = DateTime.Now;
                    p.Description = post.Description;
                    p.MetaTitle = post.MetaTitle;
                    p.OGDescription = post.OGDescription;
                    p.OGImage = post.OGImage;
                    p.Sitemap = post.Sitemap;
                    p.Status = post.Status;
                    p.Tag = post.Tag;
                    p.TemplateName = post.TemplateName;
                    p.Title = post.Title;
                    p.URL = post.URL;
                    p.WriterEmail = post.WriterEmail;
                    p.WriterName = post.WriterName;

                    //db.Entry(p).State = EntityState.Modified;
                    db.SaveChanges();
                }
                else
                {
                    return BadRequest("URL already exist.");
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PostExists(id))
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

        // POST: api/Posts
        [ResponseType(typeof(Post))]
        [Authorize(Roles = "Admin")]
        public IHttpActionResult PostPost([FromBody]Post post)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (string.IsNullOrEmpty(post.Title) || string.IsNullOrEmpty(post.Tag) || string.IsNullOrEmpty(post.Description)
                || string.IsNullOrEmpty(post.Article) || string.IsNullOrEmpty(post.WriterName) || string.IsNullOrEmpty(post.WriterEmail)
                || string.IsNullOrEmpty(post.URL))
            {
                return BadRequest("Required field missing.");
            }
            if (db.Posts.Count(t => t.URL == post.URL) == 0)
            {
                Post p = new Post();
                p.Article = post.Article;
                p.Category = db.Categories.FirstOrDefault(t => t.ID == post.Category.ID);
                p.CreatedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
                p.DateCreated = DateTime.Now;
                p.Description = post.Description;
                p.MetaTitle = post.MetaTitle;
                p.OGDescription = post.OGDescription;
                p.OGImage = post.OGImage;
                p.Sitemap = post.Sitemap;
                p.Status = post.Status;
                p.Tag = post.Tag;
                p.TemplateName = post.TemplateName;
                p.Title = post.Title;
                p.URL = post.URL;
                p.WriterEmail = post.WriterEmail;
                p.WriterName = post.WriterName;
                db.Posts.Add(p);
                db.SaveChanges();

                return CreatedAtRoute("DefaultApi", new { id = p.ID }, p);
            }
            else
            {
                return BadRequest("URL already exist.");
            }
        }

        // DELETE: api/Posts/5
        [ResponseType(typeof(Post))]
        [Authorize(Roles = "Admin")]
        public IHttpActionResult DeletePost(int id)
        {
            Post post = db.Posts.Find(id);
            if (post == null)
            {
                return NotFound();
            }

            db.Posts.Remove(post);
            db.SaveChanges();

            return Ok(post);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool PostExists(int id)
        {
            return db.Posts.Count(e => e.ID == id) > 0;
        }
    }
}