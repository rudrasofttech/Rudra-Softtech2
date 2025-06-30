using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RST.Model
{
    public class UserWebsiteTheme
    {
        [Required]
        public Guid Id { get; set; } = Guid.NewGuid();
        [MaxLength(100)]
        [Required]
        public string Name { get; set; } = string.Empty;
        [MaxLength(500)]
        public string Tags { get; set; } = string.Empty;
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
        public DateTime? ModifyDate { get; set; } = null;
        public string Html { get; set; } = string.Empty;
        [JsonIgnore]
        public int CreatedById { get; set; }
        [JsonIgnore]
        public int? ModifiedById { get; set; } = null;
        public WebsiteType WSType { get; set; } = WebsiteType.None;
    }
}
