using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Web.Service;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using RST.Model;
using RST.Model.DTO;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace RST.Web.Pages.Account
{
    public class LoginModel(RSTAuthenticationService _authService, IConfiguration config) : PageModel
    {
        private readonly IConfiguration _config = config;
        private readonly RSTAuthenticationService authService = _authService;
        public List<string> Errors { get; set; } = [];
        [Required]
        [MaxLength(150)]
        [BindProperty]
        public string Email { get; set; } = string.Empty;
        [Required]
        [BindProperty]
        [DataType(DataType.Password)]
        [MaxLength(150)]
        public string Password { get; set; } = string.Empty;

        public string Error { get; set; } = string.Empty;

        public LoginReturnDTO LoginReturn { get; set; } = null!;
        public Member? CurrentMember { get; set; }

        public void OnGet()
        {
            if (User.Identity.IsAuthenticated)
            {
                var email = User.Claims.First(t => t.Type == ClaimTypes.NameIdentifier).Value;
                CurrentMember = authService.GetUser(email);
            }
        }

        public async void OnPost()
        {
            LoginReturn = null;
            if (!ModelState.IsValid)
                return;
            Error = string.Empty;
            if (!authService.AnyLoginAttempteRemain(Email))
            {
                Error = $"You have exhausted all login attempts. Please wait for {authService.CoolOffTimeImMinutes} minutes.";
                return;
            }

            var tuple = authService.ValidateUser(Email, Password);
            var m = tuple.Item1;
            if (tuple.Item2)
            {
                var claims = new List<Claim>() {
                new(ClaimTypes.NameIdentifier,  m.Email),
                new(ClaimTypes.Email, m.Email),
                new("FullName", m.FirstName)};
                if (m.UserType == MemberTypeType.Admin)
                    claims.Add(new Claim(ClaimTypes.Role, "admin"));
                else if (m.UserType == MemberTypeType.Author)
                    claims.Add(new Claim(ClaimTypes.Role, "author"));
                else if (m.UserType == MemberTypeType.Member)
                    claims.Add(new Claim(ClaimTypes.Role, "member"));
                else if (m.UserType == MemberTypeType.Editor)
                    claims.Add(new Claim(ClaimTypes.Role, "editor"));
                else if (m.UserType == MemberTypeType.Demo)
                    claims.Add(new Claim(ClaimTypes.Role, "demo"));
                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity));
                string rurl = string.Empty;
                if (Request.Query.ContainsKey("returnurl"))
                    rurl = Request.Query["returnurl"].ToString();
                LoginReturn = new LoginReturnDTO() { Member = m, Token = GenerateJSONWebToken(m), ReturnURL = rurl };
            }
            else
            {
                Error = $"Unable to validate credentials.";
            }
        }

        private string GenerateJSONWebToken(Member m)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var dt = DateTime.UtcNow.AddDays(90);
            var claims = new List<Claim>() {
                new(ClaimTypes.NameIdentifier,  m.Email),
                new(ClaimTypes.Email, m.Email),
                new("FullName", m.FirstName),
                new(JwtRegisteredClaimNames.Exp, dt.ToString("yyyy-MM-dd")),
                new(JwtRegisteredClaimNames.Jti, m.Email)};
            if (m.UserType == MemberTypeType.Admin)
                claims.Add(new Claim(ClaimTypes.Role, "admin"));
            else if (m.UserType == MemberTypeType.Author)
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
