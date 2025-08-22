using RST.Model.Attributes;
using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    public class CreateLinkListWebsiteDTO
    {
        [Required(ErrorMessage = "Website name is required.")]
        [MaxLength(50, ErrorMessage = "Website name cannot exceed 50 characters in length.")]
        [MinLength(3, ErrorMessage = "Website name must be minimum 3 characters.")]
        [DomainSafeName]
        public string WebsiteName { get; set; } = string.Empty;

        [Required]
        public Guid ThemeId { get; set; }

        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(250)]
        public string Line { get; set; } = string.Empty;

        public string Photo { get; set; } = string.Empty;

        public List<LinkListItem> Links { get; set; } = new();

        [MaxLength(300)]
        public string? Youtube { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? Instagram { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? LinkedIn { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? Twitter { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? Facebook { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Telegram { get; set; } = string.Empty;

        [MaxLength(15)]
        public string? WhatsApp { get; set; } = string.Empty;
    }
}