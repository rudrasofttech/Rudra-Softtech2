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
    [Authorize(Roles = "Admin,Demo")]
    [ApiController]
    public class CustomPagesController(RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;

        [HttpGet]
        public IActionResult Get()
        {
            try
            {
                List<CustomPageDTO> result = [.. db.CustomPages.Select(m => new CustomPageDTO()
                {
                    ID = m.ID,
                    Body = m.Body,
                    CreatedBy = m.CreatedBy.ID,
                    Title = m.Title,
                    Status = m.Status,
                    CreatedByName = m.CreatedBy.FirstName,
                    DateCreated = m.DateCreated,
                    DateModified = m.DateModified,
                    Head = m.Head,
                    ModifiedBy = (m.ModifiedBy == null) ? 0 : m.ModifiedBy.ID,
                    Name = m.Name,
                    NoTemplate = m.NoTemplate,
                    PageMeta = m.PageMeta,
                    Sitemap = m.Sitemap,
                    ModifiedByName = (m.ModifiedBy == null) ? "" : m.ModifiedBy.FirstName
                })];

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to load pages.", exception = ex.Message });
            }
        }

        // GET: api/CustomPages/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
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
                return StatusCode(500, new { error = "Unable to load page.", exception = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [Route("update")]
        // PUT: api/CustomPages/5
        public IActionResult Update([FromBody] CustomPageDTO page)
        {
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
                var cp = db.CustomPages.First(t => t.ID == page.ID);
                cp.Head = page.Head;
                cp.Name = page.Name;
                cp.NoTemplate = page.NoTemplate;
                cp.PageMeta = page.PageMeta;
                cp.Sitemap = page.Sitemap;
                cp.Status = page.Status;
                cp.Title = page.Title;
                cp.Body = page.Body;
                cp.DateModified = DateTime.Now;
                cp.ModifiedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
                db.Entry(cp).State = EntityState.Modified;
                db.SaveChanges();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to update page.", exception = ex.Message });
            }

            return Ok();
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [Route("add")]
        // POST: api/CustomPages
        public IActionResult Add([FromBody] CustomPageDTO page)
        {
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
                    var cp = new CustomPage()
                    {
                        Body = page.Body,
                        CreatedBy = db.Members.First(d => d.Email == User.Identity.Name),
                        DateCreated = DateTime.Now,
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
                return StatusCode(500, new { error = "Unable to add page.", exception = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [Route("delete/{id}")]
        // DELETE: api/CustomPages/5
        [HttpGet]
        public IActionResult Delete(int id)
        {
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
                return StatusCode(500, new { error = "Unable to delete page.", exception = ex.Message });
            }
        }
    }
}
