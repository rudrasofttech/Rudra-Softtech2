using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    /// <summary>
    /// Represents a model for updating a virtual business card (vCard) with various personal, professional, and contact
    /// details.
    /// </summary>
    /// <remarks>This model is used to update the details of an existing vCard. It includes fields for
    /// personal information,  company details, social media links, and contact information. Some fields have length
    /// constraints,  and certain fields are required for a valid update.</remarks>
    public class UpdateVCardModel
    {
        [Required]
        public Guid Id { get; set; }
        [MaxLength(50)]
        public string? Company { get; set; }
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
    }
}
