using System.ComponentModel.DataAnnotations;

namespace RST.Model
{
    public class LinkListDetail
    {
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        // A short description or tagline
        [MaxLength(250)]
        public string Line { get; set; } = string.Empty;

        // Main profile or cover photo
        [MaxLength(250)]
        public string Photo { get; set; } = string.Empty;

        // List of links to display on the page
        public List<LinkListItem> Links { get; set; } = [];

        // Popular social media handles (URLs)
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

        public bool HasSocialLinks =>
            !string.IsNullOrEmpty(Youtube) ||
            !string.IsNullOrEmpty(Instagram) ||
            !string.IsNullOrEmpty(LinkedIn) ||
            !string.IsNullOrEmpty(Twitter) ||
            !string.IsNullOrEmpty(Facebook) ||
            !string.IsNullOrEmpty(WhatsApp) ||
            !string.IsNullOrEmpty(Telegram);
    }

    public class LinkListItem
    {
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Url { get; set; } = string.Empty;

        [MaxLength(250)]
        public string? Description { get; set; } = string.Empty;

        // Optional icon or image for the link
        [MaxLength(250)]
        public string? Icon { get; set; } = string.Empty;
    }
}
