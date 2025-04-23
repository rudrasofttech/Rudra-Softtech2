using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class CustomPage
    {
        [Key]
        public int ID { get; set; }
        [MaxLength(200)]
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public DateTime DateCreated { get; set; }
        [Required]
        public Member CreatedBy { get; set; }
        public DateTime? DateModified { get; set; }
        public Member? ModifiedBy { get; set; }
        public PostStatus Status { get; set; } = PostStatus.Draft;
        public bool Sitemap { get; set; }
        public string Body { get; set; } = string.Empty;
        public string Head { get; set; } = string.Empty;
        public bool NoTemplate { get; set; }
        public string PageMeta { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
    }
}
