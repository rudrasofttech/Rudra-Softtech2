using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    public class UpdateLinkListModel
    {
        [Required]
        public Guid Id { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; } = string.Empty;

        [MaxLength(250)]
        public string? Line { get; set; } = string.Empty;

        
        public string? Photo { get; set; } = string.Empty;

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