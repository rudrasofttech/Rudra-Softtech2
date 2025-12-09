using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.IdentityModel.Tokens;
using RST.Model;
using RST.Model.DTO;
using RST.Web.Service;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RST.Web.Pages.Account
{
    public class LoginModel(RSTAuthenticationService _authService,
        ILogger<LoginModel> _logger,
        SMSService _smsService, EmailService _emailService, IConfiguration config) : PageModel
    {
        private readonly EmailService emailService = _emailService;
        private readonly IConfiguration _config = config;
        private readonly RSTAuthenticationService authService = _authService;
        private readonly SMSService smsService = _smsService;
        private readonly ILogger<LoginModel> logger = _logger;
        public List<string> Errors { get; set; } = [];
        //[Required(ErrorMessage = "Email is required.")]
        [EmailAddress]
        [MaxLength(150)]
        [BindProperty]
        public string Email { get; set; } = string.Empty;
        //[Required(ErrorMessage = "Password is required.")]
        //[BindProperty]
        //[DataType(DataType.Password)]
        //[MaxLength(150)]
        //public string Password { get; set; } = string.Empty;
        [MaxLength(15)]
        [BindProperty]
        public string Phone { get; set; } = string.Empty;

        [BindProperty]
        [MaxLength(5)]
        public string CountryCode { get; set; } = string.Empty;
        [BindProperty]
        public string OTP { get; set; } = string.Empty;
        public bool OtpSent { get; set; } = false;
        [BindProperty]
        public DateTime? OtpSentTime { get; set; }
        public bool CanResendOtp => OtpSentTime.HasValue && (DateTime.UtcNow - OtpSentTime.Value).TotalSeconds >= 120;

        public string Error { get; set; } = string.Empty;


        public LoginReturnDTO LoginReturn { get; set; } = null!;
        public Member? CurrentMember { get; set; }

        public void OnGet()
        {
            if (User?.Identity?.IsAuthenticated == true) // Added null checks for User and Identity
            {
                var publicId = User.Claims.First(t => t.Type == ClaimTypes.NameIdentifier).Value;
                CurrentMember = authService.GetUser(new Guid(publicId));
                if (CurrentMember == null)
                {
                    // If the user is not found in the database, sign them out and return.
                    //HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme).Wait();
                    return;
                }
                var claims = new List<Claim>() {
                new(ClaimTypes.NameIdentifier,  CurrentMember.PublicID.ToString()),
                new(ClaimTypes.Email, CurrentMember.Email),
                new("FullName", CurrentMember.FirstName)};
                if (CurrentMember.UserType == MemberTypeType.Admin)
                    claims.Add(new Claim(ClaimTypes.Role, "admin"));
                else if (CurrentMember.UserType == MemberTypeType.Author)
                    claims.Add(new Claim(ClaimTypes.Role, "author"));
                else if (CurrentMember.UserType == MemberTypeType.Member)
                    claims.Add(new Claim(ClaimTypes.Role, "member"));
                else if (CurrentMember.UserType == MemberTypeType.Editor)
                    claims.Add(new Claim(ClaimTypes.Role, "editor"));
                else if (CurrentMember.UserType == MemberTypeType.Demo)
                    claims.Add(new Claim(ClaimTypes.Role, "demo"));

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                DateTime expiry = DateTime.UtcNow.AddDays(90);
                string token = GenerateJSONWebToken(CurrentMember, expiry);

                string rurl = string.Empty;
                if (Request.Query.ContainsKey("returnUrl"))
                {
                    rurl = Request.Query["returnUrl"].ToString();
                    if (!rurl.Contains('?'))
                        rurl += "?";

                    //rurl += $"&name={CurrentMember.FirstName}&email={System.Net.WebUtility.UrlEncode(CurrentMember.Email)}&expiry={System.Net.WebUtility.UrlEncode(expiry.ToString())}&token={System.Net.WebUtility.UrlEncode(token)}";
                }
                LoginReturn = new LoginReturnDTO() { Member = CurrentMember, Expiry = expiry, Token = token, ReturnURL = rurl };
            }
        }

        public async Task<IActionResult> OnPostGenerateOtpAsync()
        {
            if (string.IsNullOrWhiteSpace(Email) && string.IsNullOrWhiteSpace(Phone))
            {
                Error = "Please enter your email or phone number.";
                return Page();
            }

            // Call your OTP generation logic here
            var m = authService.GetUser(Email, $"{CountryCode}-{Phone}");
            if (m != null)
            {
                if (m != null)
                {
                    var p = authService.CreatePasscode(m.ID, PasscodePurpose.TwoFactorAuthentication);
                    var err = await SendOTPMessageAsync(m, p);
                    if (err.Length > 0)
                    {
                        Error = err;
                    }
                }

            }
            return Page();
        }

        public async Task<IActionResult> OnPostResendOtpAsync()
        {
            if (string.IsNullOrWhiteSpace(Email) && string.IsNullOrWhiteSpace(Phone))
            {
                Error = "Please enter your email or phone number.";
                return Page();
            }
            //if (!CanResendOtp)
            //{
            //    Error = "Please wait before resending OTP.";
            //    return Page();
            //}
            var m = authService.GetUser(Email, $"{CountryCode}-{Phone}");
            if (m != null)
            {
                if (m != null)
                {
                    var p = authService.CreatePasscode(m.ID, PasscodePurpose.TwoFactorAuthentication);
                    var err = await SendOTPMessageAsync(m, p);
                    if (err.Length > 0)
                    {
                        Error = err;
                    }
                }

            }
            return Page();
        }

        private async Task<string> SendOTPMessageAsync(Member m, string otp)
        {
            var err = new StringBuilder();
            try
            {
                var em = emailService.SendPasscode(m, otp);
            }
            catch (Exception emailError)
            {
                logger.LogError(emailError, "LoginModel > SendOTPMessage");
                err.Append("<div>Unable to send email.</div>");
            }
            try
            {
                if (!string.IsNullOrWhiteSpace(m.Phone) && m.Phone.Length > 4)
                {
                    var smsresult = await smsService.SendSMSAsync(m.Phone, otp);
                }
            }
            catch (Exception smsError)
            {
                logger.LogError(smsError, "LoginModel > SendOTPMessage");
                err.Append("<div>Unable to send sms.</div>");
            }
            OtpSentTime = DateTime.UtcNow;
            OtpSent = true;

            return err.ToString();
        }

        public async void OnPostLoginOtpAsync()
        {
            if (string.IsNullOrEmpty(Email) && string.IsNullOrWhiteSpace(Phone))
            {
                Error = "Please provide either Email or Phone";
                return;
            }
            Error = string.Empty;
            if (!authService.AnyLoginAttempteRemain(Email))
            {
                Error = $"You have exhausted all login attempts. Please wait for {authService.CoolOffTimeImMinutes} minutes.";
                return;
            }

            //var tuple = authService.ValidateUser(Email, Password);
            var tuple = authService.ValidateOTP(Email, $"{CountryCode}-{Phone}", OTP);
            var m = tuple.Item1;
            if (tuple.Item2)
            {
                var claims = new List<Claim>() {
                new(ClaimTypes.NameIdentifier,  m.PublicID.ToString()),
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


                DateTime expiry = DateTime.UtcNow.AddDays(90);
                string token = GenerateJSONWebToken(m, expiry);

                string rurl = string.Empty;
                if (Request.Query.ContainsKey("returnUrl"))
                {
                    rurl = Request.Query["returnUrl"].ToString();
                    if (!rurl.Contains('?'))
                        rurl += "?";

                    //rurl += $"&name={m.FirstName}&email={System.Net.WebUtility.UrlEncode(m.Email)}&expiry={System.Net.WebUtility.UrlEncode(expiry.ToString())}&token={System.Net.WebUtility.UrlEncode(token)}";
                }
                LoginReturn = new LoginReturnDTO() { Member = m, Token = token, ReturnURL = rurl, Expiry = expiry };
            }
            else
            {
                Error = $"Unable to validate credentials.";
            }
        }

        private string GenerateJSONWebToken(Member m, DateTime expiry)
        {
            var jwtSection = _config.GetSection("Jwt");
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? string.Empty));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var audiences = jwtSection.GetSection("Audience").Get<List<string>>() ?? new List<string>();

            var dt = expiry;
            var claims = new List<Claim>() {
                new(ClaimTypes.NameIdentifier,  m.PublicID.ToString()),
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
                  null,
                  [.. claims],
                  expires: dt,
                  signingCredentials: credentials);
            token.Payload["aud"] = audiences;

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
