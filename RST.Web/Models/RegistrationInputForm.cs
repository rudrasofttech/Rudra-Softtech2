using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace RST.Web.Models
{
    public class RegistrationInputForm
    {
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

        [BindProperty]
        public Guid CaptchaKey { get; set; }
        [BindProperty]
        public string CaptchaValue { get; set; } = string.Empty;
    }
}
