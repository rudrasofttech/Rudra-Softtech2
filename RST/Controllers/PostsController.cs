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
            Post post = db.Posts.Find(id);
            if (post == null)
            {
                return NotFound();
            }

            return Ok(post);
        }

        // PUT: api/Posts/5
        [ResponseType(typeof(void))]
        public IHttpActionResult PutPost(int id, [FromBody] string Title,
        [FromBody] PostStatus Status,
        [FromBody] int CategoryID,
        [FromBody] string Tag,
        [FromBody] string Description,
        [FromBody] string Article,
        [FromBody] string WriterName,
        [FromBody] string WriterEmail,
        [FromBody] string OGImage,
        [FromBody] string OGDescription,
        [FromBody] string MetaTitle,
        [FromBody] int Viewed,
        [FromBody] string URL,
        [FromBody] string TemplateName,
        [FromBody] bool Sitemap)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(Title) || string.IsNullOrEmpty(Tag) || string.IsNullOrEmpty(Description)
                || string.IsNullOrEmpty(Article) || string.IsNullOrEmpty(WriterName) || string.IsNullOrEmpty(WriterEmail)
                || string.IsNullOrEmpty(URL))
            {
                return BadRequest("Required field missing.");
            }

            try
            {
                Post p = db.Posts.FirstOrDefault(t => t.ID == id && (t.URL == URL && t.ID != id));
                if (p != null)
                {
                    p.Article = Article;
                    p.Category = db.Categories.FirstOrDefault(t => t.ID == CategoryID);
                    p.ModifiedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
                    p.DateModified = DateTime.Now;
                    p.Description = Description;
                    p.MetaTitle = MetaTitle;
                    p.OGDescription = OGDescription;
                    p.OGImage = OGImage;
                    p.Sitemap = Sitemap;
                    p.Status = Status;
                    p.Tag = Tag;
                    p.TemplateName = TemplateName;
                    p.Title = Title;
                    p.URL = URL;
                    p.WriterEmail = WriterEmail;
                    p.WriterName = WriterName;

                    db.Entry(p).State = EntityState.Modified;
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

            return StatusCode(HttpStatusCode.NoContent);
        }

        // POST: api/Posts
        [ResponseType(typeof(Post))]
        public IHttpActionResult PostPost([FromBody] string Title,
        [FromBody] PostStatus Status,
        [FromBody] int CategoryID,
        [FromBody] string Tag,
        [FromBody] string Description,
        [FromBody] string Article,
        [FromBody] string WriterName,
        [FromBody] string WriterEmail,
        [FromBody] string OGImage,
        [FromBody] string OGDescription,
        [FromBody] string MetaTitle,
        [FromBody] int Viewed,
        [FromBody] string URL,
        [FromBody] string TemplateName,
        [FromBody] bool Sitemap)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            if (string.IsNullOrEmpty(Title) || string.IsNullOrEmpty(Tag) || string.IsNullOrEmpty(Description)
                || string.IsNullOrEmpty(Article) || string.IsNullOrEmpty(WriterName) || string.IsNullOrEmpty(WriterEmail)
                || string.IsNullOrEmpty(URL))
            {
                return BadRequest("Required field missing.");
            }
            if (db.Posts.Count(t => t.URL == URL) == 0)
            {
                Post p = new Post();
                p.Article = Article;
                p.Category = db.Categories.FirstOrDefault(t => t.ID == CategoryID);
                p.CreatedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
                p.DateCreated = DateTime.Now;
                p.Description = Description;
                p.MetaTitle = MetaTitle;
                p.OGDescription = OGDescription;
                p.OGImage = OGImage;
                p.Sitemap = Sitemap;
                p.Status = Status;
                p.Tag = Tag;
                p.TemplateName = TemplateName;
                p.Title = Title;
                p.URL = URL;
                p.WriterEmail = WriterEmail;
                p.WriterName = WriterName;
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