using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class WebsiteSetting
    {
        [Key]
        [MaxLength(50)]
        [Required]
        public string KeyName { get; set; } = string.Empty;
        
        public string KeyValue { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
    }
}
