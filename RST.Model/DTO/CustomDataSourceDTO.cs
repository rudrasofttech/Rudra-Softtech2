using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO
{
    public class CustomDataSourceDTO
    {
        public int ID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Query { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime? DateModified { get; set; }
        public int ModifiedBy { get; set; }
        public string ModifiedByName { get; set; } = string.Empty;
        public string HtmlTemplate { get; set; } = String.Empty;
    }
}
