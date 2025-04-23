using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO
{
    public class SendNewsletterDTO
    {
        public string EmailGroup { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
    }
}
