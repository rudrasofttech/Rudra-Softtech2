using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using System.Net;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class WebsiteSettingsController(RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;
        private bool CheckRole(string roles)
        {
            return User.Claims.Any(t => t.Type == ClaimTypes.Role && roles.Contains(t.Value));
        }

        [HttpGet]
        public IActionResult GetWebsiteSettings()
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
            {
                return Ok(db.WebsiteSettings.Where(t => t.KeyName != "UniversalPassword").ToList());
            }
            catch (Exception ex) {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // GET: api/WebsiteSettings/5
        [HttpGet("{id}")]
        public IActionResult GetWebsiteSetting(string id)
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            var websiteSetting = db.WebsiteSettings.FirstOrDefault(t => t.KeyName == id.Trim());
            if (websiteSetting == null)
            {
                return NotFound();
            }

            return Ok(websiteSetting);
        }

        // PUT: api/WebsiteSettings/5
        [HttpPost]
        [Route("update")]
        public IActionResult Update(WebsiteSetting websiteSetting)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var ws = db.WebsiteSettings.FirstOrDefault(t => t.KeyName == websiteSetting.KeyName.Trim());
                if (ws == null)
                {
                    return NotFound(new { error = "Setting not found" });
                }
                else
                {
                    ws.KeyValue = websiteSetting.KeyValue;
                    ws.Description = websiteSetting.Description;
                    db.SaveChanges();
                    return Ok(websiteSetting);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }

        }

        // POST: api/WebsiteSettings
        [HttpPost]
        [Route("add")]
        public IActionResult Add(WebsiteSetting websiteSetting)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                if(db.WebsiteSettings.Any(t => t.KeyName == websiteSetting.KeyName.Trim()))
                {
                    return BadRequest(new { error = "Setting name is duplicate" });
                }
                else
                {
                    db.WebsiteSettings.Add(websiteSetting);
                    db.SaveChanges();
                    return Ok(websiteSetting);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // DELETE: api/WebsiteSettings/5
        [HttpGet]
        [Route("delete/{id}")]
        public IActionResult Delete(string id)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            var websiteSetting = db.WebsiteSettings.FirstOrDefault(t => t.KeyName == id);
            if (websiteSetting == null)
            {
                return NotFound();
            }

            db.WebsiteSettings.Remove(websiteSetting);
            db.SaveChanges();

            return Ok(websiteSetting);
        }
    }
}
