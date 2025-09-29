using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using RST.Context;
using RST.Model;
using RST.Model.DTO;
using RST.Web.Service;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RST.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController(RSTContext context, ILogger<AccountController> logger, RSTAuthenticationService authService, IConfiguration config) : ControllerBase
    {
        private readonly RSTContext db = context;
        private readonly ILogger<AccountController> _logger = logger;
        private readonly RSTAuthenticationService _authenticationService = authService;
        private readonly IConfiguration _config = config;

        [HttpPost]
        [Route("login")]
        public IActionResult Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid) { 
                return BadRequest(ModelState);
            }
            try
            {
                var m = _authenticationService.ValidateUser(model.Email, model.Password);
                if (m.Item1 != null)
                {
                    if (m.Item2)
                    {
                        var dt = DateTime.UtcNow.AddDays(90);
                        var result = new LoginReturnDTO() { Member = m.Item1, Token = GenerateJSONWebToken(m.Item1, dt), Expiry = dt };
                        return Ok(result);
                    }
                    else
                    {
                        return BadRequest(new { error = $"Unable to validate credentials." });
                    }
                }
                else
                    return BadRequest(new { error = $"Unable to validate credentials." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AccountController > Login");
                return StatusCode(500, new { error = "Server Error" });
            }
        }

        //[HttpGet]
        //[Route("UpdatePassword")]
        //public IActionResult UpdatePassword()
        //{
        //    _authenticationService.UpdateEncryptedPassword();
        //    return Ok();
        //}

        private string GenerateJSONWebToken(Member m, DateTime dt)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? string.Empty));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            
            var claims = new List<Claim>() {
                new(ClaimTypes.NameIdentifier,  m.Email),
                new(ClaimTypes.Email, m.Email),
                new("FullName", m.FirstName),
                new(JwtRegisteredClaimNames.Exp, dt.ToString("yyyy-MM-dd")), 
                new(JwtRegisteredClaimNames.Jti, m.Email)};
            if(m.UserType == MemberTypeType.Admin)
                claims.Add(new Claim(ClaimTypes.Role, "admin"));
            else if(m.UserType == MemberTypeType.Author)
                claims.Add(new Claim(ClaimTypes.Role, "author"));
            else if (m.UserType == MemberTypeType.Member)
                claims.Add(new Claim(ClaimTypes.Role, "member"));
            else if (m.UserType == MemberTypeType.Editor)
                claims.Add(new Claim(ClaimTypes.Role, "editor"));
            else if (m.UserType == MemberTypeType.Demo)
                claims.Add(new Claim(ClaimTypes.Role, "demo"));
            
            var token = new JwtSecurityToken(_config["Jwt:Issuer"],
                  _config["Jwt:Issuer"],
                  [.. claims],
                  expires: dt,
                  signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
