using RST.Model.Attributes;
using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    public class CreateUserWebsiteDTO
    {
        [Required]
        [MaxLength(50)]
        [MinLength(3)]
        [DomainSafeName]
        public string Name { get; set; } = string.Empty;
        [Required]
        public WebsiteType WSType { get; set; }
        public Guid ThemeId { get; set; } = Guid.Empty;
    }

    public class AddWebsiteModel
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
    }

    public class RemoveWebsiteModel
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
    }

    public class AddWebsiteResponse
    {
        public string? Message { get; set; }
        public int? WebsiteId { get; set; }
        public string? Script { get; set; }
    }
}
