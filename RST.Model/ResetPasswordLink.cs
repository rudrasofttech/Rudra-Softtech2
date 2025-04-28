using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class ResetPasswordLink
    {
        public Guid ID { get; set; } = Guid.NewGuid();
        public Member Member { get; set; }
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
    }
}
