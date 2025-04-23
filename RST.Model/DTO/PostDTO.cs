using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO
{
    public class PostDTO
    {
        public int ID { get; set; }
        public DateTime DateCreated { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime? DateModified { get; set; }
        public int ModifiedBy { get; set; }
        public string ModifiedByName { get; set; } = string.Empty;
        public string Status { get; set; } = String.Empty;
        public bool Sitemap { get; set; }
        public string Title { get; set; } = string.Empty;
    }
}
