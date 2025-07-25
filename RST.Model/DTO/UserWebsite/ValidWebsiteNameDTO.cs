using RST.Model.Attributes;
using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    public class ValidWebsiteNameDTO
    {
        [Required(ErrorMessage = "Website name is required.")]
        [MaxLength(50, ErrorMessage = "Website name cannot exceed 50 characters in length.")]
        [MinLength(3, ErrorMessage = "Website name must be minimum 3 characters.")]
        [DomainSafeName]
        public string Name { get; set; } = string.Empty;
    }
}
