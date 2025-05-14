using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class CustomDataSource
    {
        [Key]
        public int ID { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = null!;

        public string Query { get; set; } = null!;
        [Required]
        public DateTime DateCreated { get; set; }
        [Required]
        public Member CreatedBy { get; set; } = null!;
        public DateTime? DateModified { get; set; }
        public Member? ModifiedBy { get; set; }
        public String HtmlTemplate { get; set; } = null!;
    }
}
