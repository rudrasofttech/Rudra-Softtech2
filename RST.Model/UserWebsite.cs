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
        [JsonPropertyName("vcard")]
        public VisitingCardDetail? VisitingCardDetail { get; set; } = null!;
        public string Html { get; set; } = string.Empty;
        public Guid ThemeId { get; set; } = Guid.Empty;
    }

    public class VisitingCardDetail
    {
        [MaxLength(50)]
        public string? Company { get; set; } = string.Empty;
        public string? Logo { get; set; } = string.Empty;
        [MaxLength(100)]
        public string? TagLine { get; set; } = string.Empty;
        [MaxLength(200)]
        public string? Keywords { get; set; } = string.Empty;
        [MaxLength(80)]
        public string? PersonName { get; set; } = string.Empty;
        [MaxLength(50)]
        public string? Designation { get; set; } = string.Empty;
        [MaxLength(15)]
        public string? WhatsApp { get; set; } = string.Empty;
        [MaxLength(50)]
        public string? Telegram { get; set; } = string.Empty;
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
        [MaxLength(250)]
        public string? Email { get; set; } = string.Empty;

        [MaxLength(15)]
        public string? Phone1 { get; set; } = string.Empty;
        [MaxLength(15)]
        public string? Phone2 { get; set; } = string.Empty;
        [MaxLength(15)]
        public string? Phone3 { get; set; } = string.Empty;

        public string? Address { get; set; } = string.Empty;
        [MaxLength(500)]
        public string? AboutInfo { get; set; } = string.Empty;
        public List<VCardPhoto> Photos { get; set; } = [];

        public bool HasSocialLinks => !string.IsNullOrEmpty(Youtube) || !string.IsNullOrEmpty(Instagram) || !string.IsNullOrEmpty(LinkedIn) || !string.IsNullOrEmpty(Twitter) || !string.IsNullOrEmpty(Facebook) || !string.IsNullOrEmpty(WhatsApp) || !string.IsNullOrEmpty(Telegram);
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
