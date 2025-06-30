using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO.UserWebsite
{
    public class CreateUserWebsiteDTO
    {
        [Required]
        [MaxLength(250)]
        public string Name { get; set; } = string.Empty;
        [Required]
        public WebsiteType WSType { get; set; }
        public Guid ThemeId { get; set; } = Guid.Empty;
    }
}
