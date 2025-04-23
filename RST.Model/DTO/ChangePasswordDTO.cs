using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO
{
    public class ChangePasswordDTO
    {
        [Required]
        public int MemberID { get; set; }
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;
    }
}
