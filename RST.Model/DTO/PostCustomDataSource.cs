using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO
{
    public class PostCustomDataSource
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        public string Query { get; set; }
        public string HtmlTemplate { get; set; }
    }
}
