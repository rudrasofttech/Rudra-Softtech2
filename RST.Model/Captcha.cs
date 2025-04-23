using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class Captcha
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        [MaxLength(10)]
        public string Value { get; set; } = string.Empty;
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
    }
}
