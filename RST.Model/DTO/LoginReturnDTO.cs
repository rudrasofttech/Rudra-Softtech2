using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO
{
    public class LoginReturnDTO
    {
        public Member Member { get; set; } = null!;
        public string Token { get; set; } = string.Empty;
        public DateTime Expiry { get; set; }
        public string ReturnURL { get; set; } = string.Empty;
    }
}
