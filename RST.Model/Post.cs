using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class Post
    {
        [Key]
        public int ID { get; set; }
        [MaxLength(200)]
        [Required]
        public string Title { set; get; }
        public DateTime DateCreated { get; set; }
        public Member CreatedBy { get; set; }
        public DateTime? DateModified { get; set; }
        public Member? ModifiedBy { get; set; }
        public PostStatus Status { get; set; }
        public Category Category { get; set; }
        [MaxLength(200)]
        [Required]
        public string Tag { get; set; }
        [MaxLength(1000)]
        [Required]
        public string Description { get; set; }
        [Required]
        public string Article { get; set; }
        [MaxLength(100)]
        [Required]
        public string WriterName { get; set; }
        [EmailAddress]
        [Required]
        public string WriterEmail { get; set; }
        [MaxLength(300)]
        public string OGImage { get; set; }
        [MaxLength(500)]
        public string OGDescription { get; set; }
        public string MetaTitle { get; set; }
        public int Viewed { get; set; }
        [MaxLength(250)]
        [Required]
        public string URL { get; set; }
        public string TemplateName { get; set; }
        public bool Sitemap { get; set; }
    }
}
