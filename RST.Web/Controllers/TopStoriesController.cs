using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RST.Context;
using RST.Model;
using System.Security.Claims;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TopStoriesController(RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;
        private bool CheckRole(string roles)
        {
            return User.Claims.Any(t => t.Type == ClaimTypes.Role && roles.Contains(t.Value));
        }

        public IActionResult GetTopStories()
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });
            try
            {
                return Ok(db.TopStories.Include(t => t.CreatedBy).ToList());
            }
            catch (Exception ex) {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }

        // GET: api/TopStories/5

        public IActionResult GetTopStory(int id)
        {
            if (!CheckRole("admin,demo"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            var topStory = db.TopStories.Include(t => t.Post).FirstOrDefault(t => t.ID == id);
            if (topStory == null)
            {
                return NotFound();
            }

            return Ok(topStory);
        }

        // PUT: api/TopStories/5
        [HttpPost]
        [Route("addpost/{postId}")]
        public IActionResult AddPost(int postId)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {

                if (db.TopStories.Any(t => t.Post.ID == postId))
                {
                    return BadRequest(new { error = "Post already a top story" });
                }
                else
                {
                    var post = db.Posts.FirstOrDefault(t => t.ID == postId);
                    if (post == null)
                        return NotFound(new { error = "Post not found" });
                    else
                    {
                        var ts = new TopStory() { CreatedBy = db.Members.First(d => d.Email == User.Identity.Name), DateCreated = DateTime.UtcNow, Post = post };
                        db.TopStories.Add(ts);
                        db.SaveChanges();
                        return Ok(ts);
                    }
                }

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }

        }


        // DELETE: api/TopStories/5
        [HttpGet]
        [Route("remove/{postId}")]
        public IActionResult RemovePost(int postId)
        {
            if (!CheckRole("admin"))
                return Unauthorized(new { error = Utility.UnauthorizedMessage });

            try
            {
                var topStory = db.TopStories.Include(t => t.Post).FirstOrDefault(t => t.Post.ID == postId);
                if (topStory == null)
                {
                    return NotFound();
                }

                db.TopStories.Remove(topStory);
                db.SaveChanges();

                return Ok(topStory);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Utility.ServerErrorMessage, exception = ex.Message });
            }
        }
    }
}
