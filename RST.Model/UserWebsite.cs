using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RST.Model
{
    public class UserWebsite
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        [MaxLength(250)]
        public string Name { get; set; } = string.Empty;
        [MaxLength(250)]
        public string Domain { get; set; } = string.Empty;
        [JsonIgnore]
        public string JsonData { get; set; } = string.Empty;
        [JsonIgnore]
        public Member Owner { get; set; } = null!;
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public DateTime? Modified { get; set; }
        public RecordStatus Status { get; set; } = RecordStatus.Active;
        public WebsiteType WSType { get; set; } = WebsiteType.None;
        [NotMapped]
        public VisitingCardDetail? VisitingCardDetail { get; set; } = null!;
        public string Html { get; set; } = string.Empty;
        public Guid ThemeId { get; set; } = Guid.Empty;
    }

    public class VisitingCardDetail
    {
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

    public class VCardPhoto
    {
        public Guid PhotoId { get; set; } = Guid.NewGuid();
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;
        [MaxLength(250)]
        public string Photo { get; set; } = string.Empty;
    }
}
