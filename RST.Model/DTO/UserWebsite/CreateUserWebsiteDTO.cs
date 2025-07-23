using RST.Model.Attributes;
using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    public class CreateUserWebsiteDTO
    {
        [Required]
        [MaxLength(50)]
        [DomainSafeName]
        public string Name { get; set; } = string.Empty;
        [Required]
        public WebsiteType WSType { get; set; }
        public Guid ThemeId { get; set; } = Guid.Empty;
    }
}
