using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO
{
    public class CustomPageDTO
    {
        public int ID { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime? DateModified { get; set; }
        public int ModifiedBy { get; set; }
        public string ModifiedByName { get; set; } = string.Empty;
        public PostStatus Status { get; set; }
        public bool Sitemap { get; set; }
        public string Body { get; set; } = string.Empty;
        public string Head { get; set; } = string.Empty;
        public bool NoTemplate { get; set; }
        public string PageMeta { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;

        public CustomPageDTO()
        {
            Status = PostStatus.Draft;
        }
    }
}
