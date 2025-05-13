using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO;
using System.Runtime.CompilerServices;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PostsController(RSTContext context, ILogger<PostsController> _logger) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<PostsController> logger = _logger;

        private bool CheckRole(string roles)
        {
            return User.Claims.Any(t => t.Type == ClaimTypes.Role && roles.Contains(t.Value));
        }

        [HttpGet]
        public IActionResult Get()
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
            {
                List<PostDTO> result = [.. db.Posts.Include(t => t.CreatedBy).Include(t => t.ModifiedBy)
                    .OrderByDescending(t => t.DateCreated).ThenBy(t => t.Title).Select(m => new PostDTO()
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
                })];

                return Ok(result);
            }
            catch (Exception ex) {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // GET: api/Posts/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

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
        [Route("update")]
        public IActionResult Update([FromBody] Post post)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

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
                var p = db.Posts.FirstOrDefault(t => t.ID == post.ID && !(t.URL == post.URL && t.ID != post.ID));
                if (p != null)
                {
                    var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                    var m = db.Members.First(d => d.Email == email);
                    p.Article = post.Article;
                    p.Category = db.Categories.First(t => t.ID == post.Category.ID);
                    p.ModifiedBy = m;
                    p.DateModified = DateTime.UtcNow;
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
                    db.SaveChanges();
                    return Ok(p);
                }
                else
                {
                    return BadRequest("URL already exist.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "PostsController > Update");
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }

            
        }

        // POST: api/Posts
        [HttpPost]
        public IActionResult Post([FromBody] Post post)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
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
                    var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                    var m = db.Members.First(d => d.Email == email);
                    var p = new Post
                    {
                        Article = post.Article,
                        Category = db.Categories.First(t => t.ID == post.Category.ID),
                        CreatedBy = m,
                        DateCreated = DateTime.UtcNow,
                        Description = post.Description,
                        MetaTitle = post.MetaTitle,
                        OGDescription = post.OGDescription,
                        OGImage = post.OGImage,
                        Sitemap = post.Sitemap,
                        Status = post.Status,
                        Tag = post.Tag,
                        TemplateName = post.TemplateName,
                        Title = post.Title,
                        URL = post.URL,
                        WriterEmail = post.WriterEmail,
                        WriterName = post.WriterName
                    };
                    db.Posts.Add(p);
                    db.SaveChanges();
                    return Ok(p);
                }
                else
                {
                    return BadRequest("URL already exist.");
                }
            }catch(Exception ex)
            {
                logger.LogError(ex, "Postscontroller > post");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        // DELETE: api/Posts/5
        [HttpGet]
        [Route("remove/{id}")]
        public IActionResult Remove(int id)
        {
            try
            {
                if (!CheckRole("admin"))
                    return Unauthorized(new { error = Utility.UnauthorizedMessage });

                var post = db.Posts.FirstOrDefault(t => t.ID == id);
                if (post == null)
                    return NotFound();

                db.Posts.Remove(post);
                db.SaveChanges();

                return Ok(post);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Postscontroller > post");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }
    }
}
