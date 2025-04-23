using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using RST.Model.DTO;
using System.Net;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MembersController(RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;

        [HttpGet]
        public IActionResult Get(int page = 1, int psize = 20)
        {
            try
            {
                int count = db.Members.Count();
                var result = new PagedData<Member>() { PageIndex = page, PageSize = psize };
                result.TotalRecords = count;

                var query = db.Members.OrderBy(t => t.ID).Skip((page - 1) * psize).Take(psize);

                foreach (Member m in query.ToList())
                {
                    result.Items.Add(m);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to load members list.", exception = ex.Message });
            }
        }

        [Route("ChangePassword/{id}")]
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult ChangePassword(int id, [FromBody] ChangePasswordDTO data)
        {
            try
            {
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
                return StatusCode(500, new { error = "Unable to change password of the member.", exception = ex.Message });
            }
        }

        // GET: api/Members/5
        [HttpGet("{id}")]
        public IActionResult Get(int id)
        {
            try
            {
                var member = db.Members.FirstOrDefault(m => m.ID == id);
                if (member == null)
                {
                    return NotFound();
                }
                return Ok(member);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to load member.", exception = ex.Message });
            }
        }


        // DELETE: api/Members/5
        [HttpGet]
        [Route("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult Delete(int id)
        {
            try
            {
                var member = db.Members.FirstOrDefault(m => m.ID == id);
                if (member == null)
                {
                    return NotFound();
                }
                member.Status = MemberStatus.Deleted;
                member.ModifyDate = DateTime.Now;
                db.Entry(member).State = EntityState.Modified; db.SaveChanges();

                return Ok(member);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Unable to delete member.", exception = ex.Message });
            }
        }

    }
}
