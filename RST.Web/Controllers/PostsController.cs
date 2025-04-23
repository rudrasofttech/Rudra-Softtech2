using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Demo")]
    public class PostsController(RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;

        [HttpGet]
        public List<PostDTO> Get()
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
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            if (id == 0)
            {
                return Ok(new Post() { Category = new Category() { ID = 0, Name = "" } });
            }
            var post = db.Posts.Include(c => c.Category).FirstOrDefault(t => t.ID == id);
            if (post == null)
            {
                return NotFound();
            }

            return Ok(post);
        }

        // PUT: api/Posts/5
        [HttpPost]
        [Route("update/{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult Update(int id, [FromBody] Post post)
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
                var p = db.Posts.FirstOrDefault(t => t.ID == id && !(t.URL == post.URL && t.ID != id));
                if (p != null)
                {
                    p.Article = post.Article;
                    p.Category = db.Categories.First(t => t.ID == post.Category.ID);
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
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult Post([FromBody] Post post)
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
            if (!db.Posts.Any(t => t.URL == post.URL))
            {
                var p = new Post();
                p.Article = post.Article;
                p.Category = db.Categories.First(t => t.ID == post.Category.ID);
                p.CreatedBy = db.Members.First(d => d.Email == User.Identity.Name);
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

                return Ok(p);
            }
            else
            {
                return BadRequest("URL already exist.");
            }
        }

        // DELETE: api/Posts/5
        [HttpGet]
        [Route("remove/{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult Remove(int id)
        {
            var post = db.Posts.FirstOrDefault(t => t.ID == id);
            if (post == null)
                return NotFound();
            

            db.Posts.Remove(post);
            db.SaveChanges();

            return Ok(post);
        }

       

        private bool PostExists(int id)
        {
            return db.Posts.Any(e => e.ID == id);
        }
    }
}
