using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RST.Context;
using RST.Model;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController(ILogger<CategoriesController> logger, RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<CategoriesController> _logger = logger;

        private bool CheckRole(string roles)
        {
            return User.Claims.Any(t => t.Type == ClaimTypes.Role && roles.Contains(t.Value));
        }

        // GET: api/Categories
        [HttpGet]
        public List<Category> Get()
        {
            return [.. db.Categories];
        }

        // GET: api/Categories/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            
            var category = db.Categories.FirstOrDefault(t => t.ID == id);
            if (category == null)
                return NotFound();

            return Ok(category);
        }

        // PUT: api/Categories/5
        [HttpPost]
        [Route("update")]
        [Authorize]
        public IActionResult Update([FromBody] Category category)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var c = db.Categories.FirstOrDefault(t => t.ID == category.ID);
                if (c == null)
                    return NotFound(new { error = "Category not found" });
                else
                {
                    c.Name = category.Name;
                    c.UrlName = category.UrlName;
                    c.Status = category.Status;
                    db.SaveChanges();
                    return Ok(c);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // POST: api/Categories
        [HttpPost]
        [Route("add")]
        public IActionResult Add([FromBody] Category category)
        {
            try
            {
                if (!CheckRole("admin"))
                    return Unauthorized(new { error = Utility.UnauthorizedMessage });

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                category.ID = 0;
                if (db.Categories.Any(t => t.Name == category.Name.Trim()))
                    return BadRequest(new { error = "Duplicate category name." });
                if (db.Categories.Any(t => t.UrlName == category.UrlName.Trim()))
                    return BadRequest(new { error = "Duplicate category url." });
                db.Categories.Add(category);
                db.SaveChanges();

                return Ok(category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // DELETE: api/Categories/5
        [HttpGet]
        [Route("delete/{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                if (!CheckRole("admin"))
                    return Unauthorized(new { error = Utility.UnauthorizedMessage });

                var category = db.Categories.FirstOrDefault(t => t.ID == id);
                if (category == null)
                {
                    return NotFound();
                }
                if (!db.Posts.Any(c => c.Category.ID == id))
                {
                    db.Categories.Remove(category);
                }
                else
                {
                    category.Status = MemberStatus.Deleted;
                }
                db.SaveChanges();
                return Ok(category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }
    }
}
