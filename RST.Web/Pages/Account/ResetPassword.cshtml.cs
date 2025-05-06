using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Web.Service;
using System.ComponentModel.DataAnnotations;

namespace RST.Web.Pages.Account
{
    public class ResetPasswordModel(ILogger<ResetPasswordModel> logger, RSTAuthenticationService _authService) : PageModel
    {
        private readonly ILogger<ResetPasswordModel> _logger = logger;
        private readonly RSTAuthenticationService authService = _authService;
        //private readonly WebsiteSettingsService wsService = _wsService;
        //private readonly EmailService emailService = _emailService;

        public string Error { get; set; } = string.Empty;
        public string Success { get; set; } = string.Empty;
        public bool ShowForm { get; set; }
        [BindProperty]
        [MinLength(8)]
        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        [Compare("Password", ErrorMessage = "This should match password.")]
        [BindProperty]
        [Required]
        [DataType(DataType.Password)]
        public string ConfirmPassword { get; set; } = string.Empty;

        public void OnGet(Guid id)
        {
            ShowForm = false;
            try
            {
                var obj = authService.GetResetPasswordLink(id);
                if (obj == null)
                {
                    Error = "Invalid reset password link";
                    return;
                }
                else
                {
                    if (obj.CreateDate.AddMinutes(5) < DateTime.UtcNow)
                    {
                        Error = "Reset password link expired.";
                        authService.RemoveResetPasswordLink(obj.ID);
                        return;
                    }
                    ShowForm = true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ResetPassword > OnGet");

            }
        }

        public void OnPost(Guid id)
        {
            try
            {
                ShowForm = false;
                if (!ModelState.IsValid)
                {
                    ShowForm = true;
                    return;
                }

                var obj = authService.GetResetPasswordLink(id);
                if (obj == null)
                {
                    Error = "Invalid reset password link";
                    return;
                }
                else
                {
                    if (obj.CreateDate.AddMinutes(5) < DateTime.UtcNow)
                    {
                        Error = "Reset password link expired.";
                        authService.RemoveResetPasswordLink(obj.ID);
                        return;
                    }
                    ShowForm = true;
                    authService.ResetPassword(obj.Member.ID, Password);
                    ShowForm = false;
                    Success = $"Your password is reset. Please go to <a href='{Url.Content("~/account/login")}'>Login</a> now.";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ResetPassword > OnGet");

            }
        }
    }
}
