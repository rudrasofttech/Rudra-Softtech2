using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO;
using System.Net;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MembersController(RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;

        private bool CheckRole(string roles)
        {
            return User.Claims.Any(t => t.Type == ClaimTypes.Role && roles.Contains(t.Value));
        }

        [HttpGet]
        public IActionResult Get(int page = 1, int psize = 20)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            try
            {
                int count = db.Members.Count();
                var result = new PagedData<Member>
                {
                    PageIndex = page,
                    PageSize = psize,
                    TotalRecords = count
                };

                var query = db.Members.OrderBy(t => t.ID).Skip((page - 1) * psize).Take(psize);

                foreach (Member m in query.ToList())
                {
                    result.Items.Add(m);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        [Route("ChangePassword/{id}")]
        [HttpPost]
        public IActionResult ChangePassword(int id, [FromBody] ChangePasswordDTO data)
        {
            try
            {
                if (!CheckRole("admin"))
                    return Unauthorized(new { error = Utility.UnauthorizedMessage });

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                var member = db.Members.FirstOrDefault(m => m.ID == id);
                if (member == null)
                {
                    return NotFound();
                }

                member.Password = data.NewPassword;
                member.ModifiedBy = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
                member.ModifyDate = DateTime.Now;
                db.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // GET: api/Members/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            try
            {
                if (!CheckRole("admin"))
                    return Unauthorized(new { error = Utility.UnauthorizedMessage });

                var member = db.Members.FirstOrDefault(m => m.ID == id);
                if (member == null)
                {
                    return NotFound();
                }
                return Ok(member);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }


        // DELETE: api/Members/5
        [HttpGet]
        [Route("delete/{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                if (!CheckRole("admin"))
                    return Unauthorized(new { error = Utility.UnauthorizedMessage });

                var member = db.Members.FirstOrDefault(m => m.ID == id);
                if (member == null)
                {
                    return NotFound();
                }
                member.Status = RecordStatus.Deleted;
                member.ModifyDate = DateTime.Now;
                db.Entry(member).State = EntityState.Modified; db.SaveChanges();

                return Ok(member);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

    }
}
