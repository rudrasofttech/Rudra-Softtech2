using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PostsController(RSTContext context, ILogger<PostsController> logger) : RSTBaseController(context)
    {
        private readonly ILogger<PostsController> _logger = logger;

        [HttpGet]
        public IActionResult Get([FromQuery] int p = 1, [FromQuery] int ps = 10, [FromQuery] string? q = null)
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            if (ps <= 0 || ps > 20)
                ps = 20;
            try
            {
                var query = db.Posts
                    .Include(t => t.CreatedBy)
                    .Include(t => t.ModifiedBy)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(q))
                {
                    var keyword = q.Trim().ToLower();
                    query = query.Where(t =>
                        t.Title.ToLower().Contains(keyword) ||
                        t.Description.ToLower().Contains(keyword) ||
                        t.WriterName.ToLower().Contains(keyword));
                }

                query = query
                    .OrderByDescending(t => t.DateCreated)
                    .ThenBy(t => t.Title);

                var result = new PagedData<PostDTO>
                {
                    TotalRecords = query.Count(),
                    PageIndex = p,
                    PageSize = ps,
                    Items = [.. query
                        .Skip((p - 1) * ps)
                        .Take(ps)
                        .Select(m => new PostDTO()
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
                        })]
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PostsController > Get");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        // GET: api/Posts/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            try
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "PostsController > Get");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
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
                    p.Description = model.Description ?? string.Empty;
                    p.MetaTitle = model.MetaTitle ?? string.Empty;
                    p.OGDescription = model.OGDescription;
                    p.OGImage = model.OGImage ?? string.Empty;
                    p.Sitemap = model.Sitemap;
                    p.Status = model.Status;
                    p.Tag = model.Tag ?? string.Empty;
                    p.TemplateName = model.TemplateName ?? string.Empty;
                    p.Title = model.Title ?? string.Empty;
                    p.URL = model.URL ?? string.Empty;
                    p.WriterEmail = model.WriterEmail ?? string.Empty;
                    p.WriterName = model.WriterName ?? string.Empty;
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
                _logger.LogError(ex, "PostsController > Update");
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
                        Description = model.Description ?? string.Empty,
                        MetaTitle = model.MetaTitle ?? string.Empty,
                        OGDescription = model.OGDescription ?? string.Empty,
                        OGImage = model.OGImage ?? string.Empty,
                        Sitemap = model.Sitemap,
                        Status = model.Status,
                        Tag = model.Tag ?? string.Empty,
                        TemplateName = model.TemplateName ?? string.Empty,
                        Title = model.Title ?? string.Empty,
                        URL = model.URL ?? string.Empty,
                        WriterEmail = model.WriterEmail ?? string.Empty,
                        WriterName = model.WriterName ?? string.Empty
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
                _logger.LogError(ex, "Postscontroller > post");
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
                _logger.LogError(ex, "Postscontroller > post");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        // POST: api/Posts/copy/5
        [HttpPost]
        [Route("copy/{id}")]
        public IActionResult Copy(int id)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            try
            {
                var source = db.Posts.Include(t => t.Category).FirstOrDefault(t => t.ID == id);
                if (source == null)
                    return NotFound();

                var member = GetCurrentMember();
                if (member == null)
                    return Unauthorized(new { error = Utility.UnauthorizedMessage });

                // Generate a unique title and URL by appending COPY suffix(es)
                var newTitle = source.Title + " COPY";
                var newUrl = source.URL + "-copy";

                int counter = 1;
                while (db.Posts.Any(t => t.URL == newUrl))
                {
                    newUrl = source.URL + "-copy-" + counter;
                    newTitle = source.Title + " COPY " + counter;
                    counter++;
                }

                var copy = new Post
                {
                    Article = source.Article,
                    Category = source.Category,
                    CreatedBy = member,
                    DateCreated = DateTime.UtcNow,
                    Description = source.Description,
                    MetaTitle = source.MetaTitle,
                    OGDescription = source.OGDescription,
                    OGImage = source.OGImage,
                    Sitemap = source.Sitemap,
                    Status = source.Status,
                    Tag = source.Tag,
                    TemplateName = source.TemplateName,
                    Title = newTitle,
                    URL = newUrl,
                    WriterEmail = source.WriterEmail,
                    WriterName = source.WriterName
                };

                db.Posts.Add(copy);
                db.SaveChanges();

                return Ok(copy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PostsController > Copy");
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }
    }
}
