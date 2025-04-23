using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class ResetPasswordLink
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public long MemberId { get; set; }
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
    }
}
