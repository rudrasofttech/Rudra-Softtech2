using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class CustomPagesController(RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;

        private bool CheckRole(string roles)
        {
            return User.Claims.Any(t => t.Type == ClaimTypes.Role && roles.Contains(t.Value));
        }

        [HttpGet]
        [Route("list")]
        public IActionResult Get()
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            var result = new List<CustomPageDTO>();
            try
            {

                foreach (var m in db.CustomPages.Include(t => t.CreatedBy).Include(t => t.ModifiedBy)
                    .OrderByDescending(t => t.DateModified)
                    .ThenByDescending(t => t.DateCreated)
                    .ThenBy(t => t.Name).ToList())
                {

                    result.Add(new CustomPageDTO()
                    {
                        ID = m.ID,
                        Body = m.Body,
                        CreatedBy = m.CreatedBy == null ? 0 : m.CreatedBy.ID,
                        Title = m.Title,
                        Status = m.Status,
                        CreatedByName = m.CreatedBy == null ? "" : m.CreatedBy.FirstName,
                        DateCreated = m.DateCreated,
                        DateModified = m.DateModified,
                        Head = m.Head,
                        ModifiedBy = (m.ModifiedBy == null) ? 0 : m.ModifiedBy.ID,
                        Name = m.Name,
                        NoTemplate = m.NoTemplate,
                        PageMeta = m.PageMeta,
                        Sitemap = m.Sitemap,
                        ModifiedByName = (m.ModifiedBy == null) ? "" : m.ModifiedBy.FirstName
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // GET: api/CustomPages/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            try
            {
                var m = db.CustomPages.FirstOrDefault(t => t.ID == id);
                if (m == null)
                {
                    return NotFound();
                }
                return Ok(m);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        [HttpPost]
        [Route("update")]
        // PUT: api/CustomPages/5
        public IActionResult Update([FromBody] CustomPageDTO page)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(page.Name) || string.IsNullOrEmpty(page.Body) || string.IsNullOrEmpty(page.Title))
            {
                return BadRequest(new { error = "Either name or body or title is missing." });
            }

            try
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                var m = db.Members.First(d => d.Email == email);
                var cp = db.CustomPages.First(t => t.ID == page.ID);
                cp.Head = page.Head;
                cp.Name = page.Name;
                cp.NoTemplate = page.NoTemplate;
                cp.PageMeta = page.PageMeta;
                cp.Sitemap = page.Sitemap;
                cp.Status = page.Status;
                cp.Title = page.Title;
                cp.Body = page.Body;
                cp.DateModified = DateTime.UtcNow;
                cp.ModifiedBy = m;
                db.Entry(cp).State = EntityState.Modified;
                db.SaveChanges();
                return Ok(cp);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }

            
        }

        [HttpPost]
        [Route("slugify")]
        [AllowAnonymous]
        // PUT: api/CustomPages/5
        public IActionResult Slugify([FromForm] string url)
        {
            return Ok(Utility.Slugify(url));
        }

        [HttpPost]
        [Route("add")]
        // POST: api/CustomPages
        public IActionResult Add([FromBody] CustomPageDTO page)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrEmpty(page.Name) || string.IsNullOrEmpty(page.Body) || string.IsNullOrEmpty(page.Title))
            {
                return BadRequest(new { error = "Either name or body or title is missing." });
            }
            try
            {
                if (!db.CustomPages.Any(t => t.Name.Trim() == page.Name.Trim()))
                {
                    var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                    var m = db.Members.First(d => d.Email == email);
                    var cp = new CustomPage()
                    {
                        Body = page.Body,
                        CreatedBy = m,
                        DateCreated = DateTime.UtcNow,
                        Head = page.Head,
                        Name = page.Name,
                        NoTemplate = page.NoTemplate,
                        PageMeta = page.PageMeta,
                        Sitemap = page.Sitemap,
                        Status = page.Status,
                        Title = page.Title
                    };
                    db.CustomPages.Add(cp);
                    db.SaveChanges();

                    return Ok(cp);
                }
                else
                {
                    return BadRequest(new { error = "Page with same name exist." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        [Route("delete/{id}")]
        [HttpGet]
        public IActionResult Delete(int id)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
            {
                var customPage = db.CustomPages.FirstOrDefault(t => t.ID == id);
                if (customPage == null)
                    return NotFound();


                db.CustomPages.Remove(customPage);
                db.SaveChanges();

                return Ok(customPage);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }
    }
}
