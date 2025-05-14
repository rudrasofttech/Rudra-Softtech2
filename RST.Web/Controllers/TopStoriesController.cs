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
    public class TopStoriesController(ILogger<TopStoriesController> _logger, RSTContext context) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<TopStoriesController> logger = _logger;
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
                return Ok(db.TopStories.Include(t => t.CreatedBy).ToList());
            }
            catch (Exception ex) {
                logger.LogError(ex, "TopStoriesController > Get");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        // GET: api/TopStories/5
        [HttpGet]
        public IActionResult Get(int id)
        {
            try
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
            catch (Exception ex) {
                logger.LogError(ex, "TopStoriesController > Get(id)");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }

        // PUT: api/TopStories/5
        [HttpPost]
        public IActionResult Post([FromForm] int postId)
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
                        var email = User.Claims.First(t => t.Type == ClaimTypes.Email).Value;
                        var m = db.Members.First(d => d.Email == email);
                        var ts = new TopStory() { 
                            CreatedBy = m, 
                            DateCreated = DateTime.UtcNow, 
                            Post = post };

                        db.TopStories.Add(ts);
                        db.SaveChanges();
                        return Ok(ts);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "TopStoriesController > Post");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }

        }


        // DELETE: api/TopStories/5
        [HttpGet]
        [Route("delete/{postId}")]
        public IActionResult Delete(int postId)
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
                logger.LogError(ex, "TopStoriesController > Delete");
                return StatusCode(500, new { error = Utility.ServerErrorMessage });
            }
        }
    }
}
