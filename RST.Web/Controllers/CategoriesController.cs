using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RST.Context;
using RST.Model;
using RST.Model.DTO;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController(ILogger<CategoriesController> _logger, RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<CategoriesController> logger = _logger;

        private bool CheckRole(string roles)
        {
            return User.Claims.Any(t => t.Type == ClaimTypes.Role && roles.Contains(t.Value));
        }

        // GET: api/Categories
        [HttpGet]
        public IActionResult Get()
        {
            try
            {
                return Ok(db.Categories.ToList());
            }
            catch (Exception ex)
            {
                logger.LogError("CategoriesController > Get");
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // GET: api/Categories/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            try
            {
                var category = db.Categories.FirstOrDefault(t => t.ID == id);
                if (category == null)
                    return NotFound();

                return Ok(category);
            }
            catch (Exception ex)
            {
                logger.LogError("CategoriesController > Get(id)");
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // PUT: api/Categories/5
        [HttpPost]
        [Route("update/{id}")]
        [Authorize]
        public IActionResult Update(int id, [FromBody] PostCategoryModel model)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var c = db.Categories.FirstOrDefault(t => t.ID == id);
                if (c == null)
                    return NotFound(new { error = "Category not found" });
                else
                {
                    c.Name = model.Name;
                    c.UrlName = model.UrlName;
                    c.Status = model.Status;
                    db.SaveChanges();
                    return Ok(c);
                }
            }
            catch (Exception ex)
            {
                logger.LogError("CategoriesController > Update");
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // POST: api/Categories
        [HttpPost]
        [Authorize]
        public IActionResult Post([FromBody] PostCategoryModel model)
        {
            try
            {
                if (!CheckRole("admin"))
                    return Unauthorized(new { error = Utility.UnauthorizedMessage });

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                
                if (db.Categories.Any(t => t.Name == model.Name.Trim()))
                    return BadRequest(new { error = "Duplicate category name." });
                if (db.Categories.Any(t => t.UrlName == model.UrlName.Trim()))
                    return BadRequest(new { error = "Duplicate category url." });
                db.Categories.Add(new Category() { 
                    Name = model.Name,
                    Status = model.Status,
                    UrlName = Utility.Slugify(model.UrlName),
                });
                db.SaveChanges();

                return Ok(model);
            }
            catch (Exception ex)
            {
                logger.LogError("CategoriesController > Post");
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // DELETE: api/Categories/5
        [HttpGet]
        [Route("delete/{id}")]
        [Authorize]
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
                logger.LogError("CategoriesController > Delete");
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }
    }
}
