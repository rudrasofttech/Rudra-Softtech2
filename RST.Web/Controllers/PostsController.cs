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
            if (string.IsNullOrWhiteSpace(roles))
                return false;

            var allowedRoles = roles
                .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries)
                .Select(r => r.Trim())
                .Where(r => !string.IsNullOrEmpty(r))
                .ToList();

            var userRoles = User.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            return allowedRoles.Any(ar => userRoles.Any(ur => string.Equals(ar, ur, StringComparison.OrdinalIgnoreCase)));
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
        [Route("update/{id}")]
        public IActionResult Update(int id,[FromBody] UpdatePostModel model)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(model.Title) || string.IsNullOrEmpty(model.Tag) || string.IsNullOrEmpty(model.Description)
                || string.IsNullOrEmpty(model.Article) || string.IsNullOrEmpty(model.WriterName) || string.IsNullOrEmpty(model.WriterEmail)
                || string.IsNullOrEmpty(model.URL))
            {
                return BadRequest("Required field missing.");
            }
            if (!db.Categories.Any(t => t.ID == model.CategoryId))
            {
                return BadRequest(new { error = "Incorrect category selected." });
            }
            try
            {
                var p = db.Posts.FirstOrDefault(t => t.ID == id && !(t.URL == model.URL && t.ID != id));
                if (p != null)
                {
                    var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                    var m = db.Members.First(d => d.Email == email);
                    p.Article = model.Article;
                    p.Category = db.Categories.First(t => t.ID == model.CategoryId);
                    p.ModifiedBy = m;
                    p.DateModified = DateTime.UtcNow;
                    p.Description = model.Description;
                    p.MetaTitle = model.MetaTitle;
                    p.OGDescription = model.OGDescription;
                    p.OGImage = model.OGImage;
                    p.Sitemap = model.Sitemap;
                    p.Status = model.Status;
                    p.Tag = model.Tag;
                    p.TemplateName = model.TemplateName;
                    p.Title = model.Title;
                    p.URL = model.URL;
                    p.WriterEmail = model.WriterEmail;
                    p.WriterName = model.WriterName;
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
        public IActionResult Post([FromBody] UpdatePostModel model)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                if (string.IsNullOrEmpty(model.Title) || string.IsNullOrEmpty(model.Tag) || string.IsNullOrEmpty(model.Description)
                    || string.IsNullOrEmpty(model.Article) || string.IsNullOrEmpty(model.WriterName) || string.IsNullOrEmpty(model.WriterEmail)
                    || string.IsNullOrEmpty(model.URL))
                {
                    return BadRequest("Required field missing.");
                }
                if(!db.Categories.Any(t => t.ID == model.CategoryId))
                {
                    return BadRequest(new { error = "Incorrect category selected." });
                }
                if (!db.Posts.Any(t => t.URL == model.URL))
                {
                    var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                    var m = db.Members.First(d => d.Email == email);
                    var p = new Post
                    {
                        Article = model.Article,
                        Category = db.Categories.First(t => t.ID == model.CategoryId),
                        CreatedBy = m,
                        DateCreated = DateTime.UtcNow,
                        Description = model.Description,
                        MetaTitle = model.MetaTitle,
                        OGDescription = model.OGDescription,
                        OGImage = model.OGImage,
                        Sitemap = model.Sitemap,
                        Status = model.Status,
                        Tag = model.Tag,
                        TemplateName = model.TemplateName,
                        Title = model.Title,
                        URL = model.URL,
                        WriterEmail = model.WriterEmail,
                        WriterName = model.WriterName
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
