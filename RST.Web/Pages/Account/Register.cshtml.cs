using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Web.Service;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace RST.Web.Pages.Account
{
    public class RegisterModel(RSTAuthenticationService _authService, EmailService _emailService, ILogger<RegisterModel> _logger, CaptchaService _captchaService) : PageModel
    {

        private readonly RSTAuthenticationService authService = _authService;
        private readonly EmailService emailService = _emailService;
        private readonly ILogger<RegisterModel> logger = _logger;
        private readonly CaptchaService _captchaManager = _captchaService;

        [Required]
        [MaxLength(150)]
        [EmailAddress(ErrorMessage = "Invalid email address.")]
        [BindProperty]
        public string Email { get; set; } = string.Empty;
        [Required]
        [BindProperty]
        [MaxLength(150)]
        [MinLength(8, ErrorMessage = "Password should be minimum 8 characters.")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
        [Required(ErrorMessage = "Your name is required.")]
        [MaxLength(150)]
        [BindProperty]
        public string MemberName { get; set; }
        public string CaptchaImage { get; set; } = string.Empty;
        [BindProperty]
        public Guid CaptchaKey { get; set; }
        [BindProperty]
        public string CaptchaValue { get; set; } = string.Empty;

        [TempData]
        public string? RegisterMessage { get; set; }

        [TempData]
        public string? Success { get; set; }

        public void OnGet()
        {
            LoadCaptcha();
        }

        private void LoadCaptcha()
        {
            _captchaManager.RemoveOld();
            var c = _captchaManager.GenerateCaptcha();
            CaptchaKey = c.Id;
            CaptchaImage = _captchaManager.CaptchaImage;
        }

        public IActionResult OnPost()
        {
            try
            {
                
                if (!ModelState.IsValid)
                {
                    RegisterMessage = "Please correct the errors and try again.";
                    LoadCaptcha();
                    return Page();
                }
                if (!_captchaManager.IsValid(CaptchaKey, CaptchaValue))
                {
                    RegisterMessage = "Invalid Captcha";
                    LoadCaptcha();
                    return Page();
                }

                if (_authService.EmailExist(Email))
                {
                    ModelState.AddModelError(nameof(Email), "Email already exists.");
                    return Page();
                }

                // Call the authentication service to register the user
                var result = _authService.CreateUser(Email, Password, true, MemberName, Model.MemberTypeType.Member);

                if (!result)
                {
                    ModelState.AddModelError(string.Empty, "Registration failed.");
                    return Page();
                }
                else
                {
                    var m = _authService.GetUser(Email); // Ensure the user is created in the database
                    if (m != null)
                    {
                        try
                        {
                            var em = emailService.SendRegistrationLink(m);
                        }
                        catch (Exception ex2)
                        {
                            logger.LogError(ex2, "RegisterModel > OnPost > SendRegistrationLink");

                        }
                    }
                    string rurl = string.Empty;
                    if (Request.Query.ContainsKey("returnurl"))
                        rurl = Request.Query["returnurl"].ToString();
                    Success = $"Your account is created and an email has been sent to your registered email address.<br /> <br /> You will redirected to <a href='{Url.Content($"~/account/login?returnurl={rurl}")}'>log in</a> now.<script>setTimeout(function () {{  window.location.href = \"{Url.Content($"~/account/login?returnurl={rurl}")}\"; }}, 2000); </script>";
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "RegisterModel > OnPost");
                ModelState.AddModelError(string.Empty, "An error occurred while processing your request. Please try again later.");
                
            }
            return Page();
        }
    }
}
