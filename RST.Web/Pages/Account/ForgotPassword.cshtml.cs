using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using RST.Web.Service;
using System.ComponentModel.DataAnnotations;

namespace RST.Web.Pages.Account
{
    public class ForgotPasswordModel(RSTAuthenticationService _authService, EmailService _emailService, ILogger<ForgotPasswordModel> _logger) : PageModel
    {
        
        private readonly RSTAuthenticationService _authService = _authService;
        private readonly EmailService emailService = _emailService;
        private readonly ILogger<ForgotPasswordModel> logger = _logger;

        [MaxLength(150)]
        [BindProperty]
        [Required(ErrorMessage = "Email is required.")]
        public string Email { get; set; } = string.Empty;

        public bool IsResetPasswordEmailSent { get; set; }
        public string Error { get; set; } = string.Empty;

        public void OnGet()
        {
        }

        public void OnPost() {
            if (!ModelState.IsValid) {
                return;
            }
            try
            {
                var m = _authService.GetUser(Email);
                if (m != null)
                {
                    var rpl = _authService.GenerateResetPasswordLink(m);
                    if (rpl != null)
                    {
                        var em = emailService.SendResetPasswordLink(m, rpl);
                        IsResetPasswordEmailSent = em.IsSent;
                    }
                    else
                    {
                        Error = "Unable to generte reset password link.";
                    }

                }
                
            }
            catch (Exception ex) {
                logger.LogError(ex, "ForgotPasswordModel > OnPost");
                Error = "Unable to send reset password link to your registered email address.";
            }
        }
    }
}
