using RST.Model.Attributes;
using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    public class ValidWebsiteNameDTO
    {
        [Required]
        [MaxLength(50)]
        [MinLength(3)]
        [DomainSafeName]
        public string Name { get; set; } = string.Empty;
    }
}
