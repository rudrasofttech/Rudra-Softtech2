using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Web.Service;
using System.ComponentModel.DataAnnotations;
using System.Drawing.Printing;
using System.Security.Claims;

namespace RST.Web.Pages.Account
{
    public class ProfileModel(RSTAuthenticationService authService, ILogger<ProfileModel> _logger, EmailService _emailService) : PageModel
    {
        private readonly RSTAuthenticationService _authService = authService;
        private readonly EmailService emailService = _emailService;
        private readonly ILogger<ProfileModel> logger = _logger;

        [Required(ErrorMessage = "Your name is required.")]
        [MaxLength(150)]
        [BindProperty]
        public string Name { get; set; } = string.Empty;

        [Required]
        [BindProperty]
        [MaxLength(15)]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [EmailAddress(ErrorMessage = "Invalid email address.")]
        [BindProperty]
        public string Email { get; set; } = string.Empty;

        [Required]
        [BindProperty]
        [MaxLength(5)]
        public string CountryCode { get; set; } = string.Empty;

        [TempData]
        public string? Success { get; set; }


        public IActionResult OnGet()
        {
            if (User?.Identity?.IsAuthenticated == true)
            {
                var publicId = User.Claims.First(t => t.Type == ClaimTypes.NameIdentifier).Value;
                var CurrentMember = authService.GetUser(new Guid(publicId));
                if (CurrentMember == null)
                {
                    HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme).Wait();
                    return Page();
                }

                Name = CurrentMember.FirstName;
                Email = CurrentMember.Email;
                // Split phone into country code and phone number
                if (!string.IsNullOrEmpty(CurrentMember.Phone) && CurrentMember.Phone.Contains('-'))
                {
                    var parts = CurrentMember.Phone.Split('-', 2);
                    CountryCode = parts[0];
                    Phone = parts[1];
                }
                else
                {
                    CountryCode = string.Empty;
                    Phone = CurrentMember.Phone;
                }
                return Page();
            }
            else
            {
                return Redirect("~/account/login");
                
            }
        }
        public IActionResult OnPost()
        {
            try
            {

                if (!ModelState.IsValid)
                {
                    return Page();
                }
                if (User?.Identity?.IsAuthenticated == true)
                {
                    var publicId = User.Claims.First(t => t.Type == ClaimTypes.NameIdentifier).Value;
                    var CurrentMember = authService.GetUser(new Guid(publicId));
                    
                    if (_authService.EmailExist(Email, CurrentMember.ID))
                    {
                        ModelState.AddModelError(nameof(Email), "Email already exists.");

                        return Page();
                    }
                    string p = string.IsNullOrWhiteSpace(Phone) ? string.Empty : $"{CountryCode}-{Phone}";
                    if (_authService.PhoneExist(p, CurrentMember.ID))
                    {
                        ModelState.AddModelError(nameof(Phone), "Phone already exists.");
                        return Page();
                    }

                    
                    var result = _authService.Update(CurrentMember.ID, Name, Email, p, CurrentMember);

                    if (result == null)
                    {
                        ModelState.AddModelError(string.Empty, "Profile update failed.");
                        return Page();
                    }
                    else
                    {
                        if (!string.IsNullOrWhiteSpace(result.Email))
                        {
                            try
                            {
                                emailService.SendEmail(result.Email, result.FirstName, "Profile Updated", $"<div style='padding-top:10px;padding-bottom:10px'>Your Rudra Softtech profile is updated.</div>", "Profile Udpate");
                            }
                            catch (Exception ex2)
                            {
                                logger.LogError(ex2, "RegisterModel > OnPost > SendActivationPasscode");
                            }
                        }
                        Success = $"Your profile is updated.";
                    }
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
