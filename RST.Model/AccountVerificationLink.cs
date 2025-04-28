using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class AccountVerificationLink
    {
        public Guid ID { get; set; } = Guid.NewGuid();
        public Member Member { get; set; }
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
        public DateTime? VerifyDate { get; set; }

    }
}
