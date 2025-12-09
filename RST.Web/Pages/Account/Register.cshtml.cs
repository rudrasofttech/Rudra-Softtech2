using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Web.Service;
using System.ComponentModel.DataAnnotations;

namespace RST.Web.Pages.Account
{
    public class RegisterModel(RSTAuthenticationService authService, 
        //EmailService _emailService, 
        ILogger<RegisterModel> _logger, 
        CaptchaService _captchaService //, SMSService _smsService
        ) : PageModel
    {

        private readonly RSTAuthenticationService _authService = authService;
        //private readonly EmailService emailService = _emailService;
        private readonly ILogger<RegisterModel> logger = _logger;
        private readonly CaptchaService _captchaManager = _captchaService;
        //private readonly SMSService smsService = _smsService;

        [Required]
        [MaxLength(150)]
        [EmailAddress(ErrorMessage = "Invalid email address.")]
        [BindProperty]
        public string Email { get; set; } = string.Empty;
        //[Required]
        //[BindProperty]
        //[MaxLength(150)]
        //[MinLength(8, ErrorMessage = "Password should be minimum 8 characters.")]
        //[DataType(DataType.Password)]
        //public string Password { get; set; } = string.Empty;
        [Required]
        [BindProperty]
        [MaxLength(15)]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [BindProperty]
        [MaxLength(5)]
        public string CountryCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Your name is required.")]
        [MaxLength(150)]
        [BindProperty]
        public string MemberName { get; set; } = string.Empty;
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

        public async Task<IActionResult> OnPostAsync()
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
                    LoadCaptcha();
                    return Page();
                }
                if (_authService.PhoneExist($"{CountryCode}-{Phone}"))
                {
                    ModelState.AddModelError(nameof(Phone), "Phone already exists.");
                    LoadCaptcha();
                    return Page();
                }
                string Password = Guid.NewGuid().ToString().Replace("-", "")[..8]; // Generate a random password
                // Call the authentication service to register the user
                var result = _authService.CreateUser(Email, Password, true, MemberName, Model.MemberTypeType.Member, $"{CountryCode}-{Phone}" );

                if (!result)
                {
                    ModelState.AddModelError(string.Empty, "Registration failed.");
                    return Page();
                }
                else
                {
                    //var m = _authService.GetUser(Email); // Ensure the user is created in the database
                    //if (m != null)
                    //{
                    //    try
                    //    {
                    //        var p = _authService.CreatePasscode(m.ID, Model.PasscodePurpose.TwoFactorAuthentication);
                    //        var em = emailService.SendPasscode(m, p);
                    //        var smsresult = await smsService.SendSMSAsync(m.Phone, p);
                    //    }
                    //    catch (Exception ex2)
                    //    {
                    //        logger.LogError(ex2, "RegisterModel > OnPost > SendActivationPasscode");

                    //    }
                    //}
                    string rurl = string.Empty;
                    if (Request.Query.ContainsKey("returnUrl"))
                        rurl = Request.Query["returnUrl"].ToString();
                    Success = $"You’re all set! Registration successful.<br /> <br /> You will redirected to <a href='{Url.Content($"~/account/login?returnUrl={rurl}?s=1")}'>log in</a> now.<script>setTimeout(function () {{  window.location.href = \"{Url.Content($"~/account/login?returnUrl={rurl}")}\"; }}, 2000); </script>";
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
