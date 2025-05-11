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
    [ApiController]
    [Authorize]
    public class CustomDataSourcesController(ILogger<CustomDataSourcesController> logger, RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<CustomDataSourcesController> _logger = logger;

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
                List<CustomDataSourceDTO> result = [.. db.CustomDataSources.Select(m => new CustomDataSourceDTO()
                {
                ID = m.ID,
                Query = m.Query,
                HtmlTemplate = m.HtmlTemplate,
                CreatedBy = m.CreatedBy.ID,
                CreatedByName = m.CreatedBy.FirstName,
                DateCreated = m.DateCreated,
                DateModified = m.DateModified,
                ModifiedBy = (m.ModifiedBy == null) ? 0 : m.ModifiedBy.ID,
                Name = m.Name,
                ModifiedByName = (m.ModifiedBy == null) ? "" : m.ModifiedBy.FirstName
            })];

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // GET: api/CustomDataSources/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            try
            {

                var customDataSource = db.CustomDataSources.FirstOrDefault(t => t.ID == id);
                if (customDataSource == null)
                    return NotFound(new { error = "Data source not found." });

                return Ok(customDataSource);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // PUT: api/CustomDataSources/
        [HttpPost]
        [Route("update")]
        public IActionResult Update([FromBody] CustomDataSource ds)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var cds = db.CustomDataSources.FirstOrDefault(t => t.ID == ds.ID);
                if (cds != null)
                {
                    cds.HtmlTemplate = ds.HtmlTemplate;
                    cds.Name = ds.Name;
                    cds.Query = ds.Query;
                    cds.ModifiedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
                    cds.DateModified = DateTime.Now;
                    db.Entry(cds).State = EntityState.Modified;
                    db.SaveChanges();
                    return Ok(cds);
                }
                else
                {
                    return BadRequest(new { error = "Unable to find data source with this id." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // POST: api/CustomDataSources
        [HttpPost]
        [Route("add")]
        public IActionResult Add([FromBody] CustomDataSource ds)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                if (db.CustomDataSources.Any(t => t.Name.Trim() == ds.Name.Trim()))
                {
                    var cds = new CustomDataSource()
                    {
                        CreatedBy = db.Members.First(d => d.Email == User.Identity.Name),
                        DateCreated = DateTime.Now,
                        HtmlTemplate = ds.HtmlTemplate,
                        Name = ds.Name,
                        Query = ds.Query
                    };
                    db.CustomDataSources.Add(cds);
                    db.SaveChanges();
                    return Ok(cds);
                }
                else
                {
                    return BadRequest(new { error = "Data source with same name exist." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // DELETE: api/CustomDataSources/5
        [HttpGet]
        [Route("delete/{id}")]
        public IActionResult Delete(int id)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            try
            {
                var customDataSource = db.CustomDataSources.FirstOrDefault(t => t.ID == id);
                if (customDataSource == null)
                {
                    return NotFound();
                }

                db.CustomDataSources.Remove(customDataSource);
                db.SaveChanges();

                return Ok(customDataSource);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }
    }
}
