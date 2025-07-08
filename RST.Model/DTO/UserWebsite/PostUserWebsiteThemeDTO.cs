using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RST.Model.DTO.UserWebsite
{
    public class PostUserWebsiteThemeDTO
    {
        [MaxLength(100)]
        [Required]
        public string Name { get; set; } = string.Empty;
        [MaxLength(500)]
        public string Tags { get; set; } = string.Empty;
        public string Html { get; set; } = string.Empty;
        public WebsiteType WSType { get; set; } = WebsiteType.None;
    }
}
