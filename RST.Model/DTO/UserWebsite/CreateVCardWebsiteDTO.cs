using RST.Model.Attributes;
using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    public class CreateVCardWebsiteDTO
    {
        [Required(ErrorMessage = "Website name is required.")]
        [MaxLength(50, ErrorMessage = "Website name cannot exceed 50 characters in length.")]
        [MinLength(3, ErrorMessage = "Website name must be minimum 3 characters.")]
        [DomainSafeName]
        public string WebsiteName { get; set; } = string.Empty;
        public Guid ThemeId { get; set; } = Guid.Empty;

        [MaxLength(50)]
        public string? Company { get; set; }
        [MaxLength(250)]
        public string? Logo { get; set; }
        [MaxLength(100)]
        public string? TagLine { get; set; }
        [MaxLength(200)]
        public string? Keywords { get; set; }
        [MaxLength(80)]
        public string? PersonName { get; set; }
        [MaxLength(50)]
        public string? Designation { get; set; }
        [MaxLength(15)]
        public string? WhatsApp { get; set; }
        [MaxLength(50)]
        public string? Telegram { get; set; }
        [MaxLength(300)]
        public string? Youtube { get; set; }
        [MaxLength(300)]
        public string? Instagram { get; set; }
        [MaxLength(300)]
        public string? LinkedIn { get; set; }
        [MaxLength(300)]
        public string? Twitter { get; set; }
        [MaxLength(300)]
        public string? Facebook { get; set; }
        [MaxLength(250)]
        public string? Email { get; set; }

        [MaxLength(15)]
        public string? Phone1 { get; set; }
        [MaxLength(15)]
        public string? Phone2 { get; set; }
        [MaxLength(15)]
        public string? Phone3 { get; set; }

        public string? Address { get; set; }
        [MaxLength(500)]
        public string? AboutInfo { get; set; }
        public List<VCardPhoto> Photos { get; set; } = [];
    }
}
