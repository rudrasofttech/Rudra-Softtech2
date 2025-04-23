using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO
{
    public class EmailMessageListDTO
    {
        public List<EmailMessage> Messages { get; set; } = [];
        public int TotalPages { get; set; }
        public int Page { get; set; }

        
    }
}
