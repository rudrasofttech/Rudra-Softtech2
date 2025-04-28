using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace RST.Model
{
    public class Member
    {
        [Key]
        public int ID { get; set; }
        [EmailAddress]
        [Required]
        public string Email { get; set; } = string.Empty;
        [MaxLength(100)]
        [Required]
        [JsonIgnore]
        public string Password { get; set; } = string.Empty;

        [JsonIgnore]
        public byte[]? EncryptedPassword { get; set; }
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
        public bool Newsletter { get; set; }
        public MemberTypeType UserType { get; set; }
        [MaxLength(200)]
        public string FirstName { get; set; } = string.Empty;
        public MemberStatus Status { get; set; }
        public DateTime? LastLogon { get; set; }
        public DateTime? ModifyDate { get; set; }
        public Member? ModifiedBy { get; set; }
        public DateTime? LastLoginAttempt { get; set; }
        public int InvalidAttemptCount { get; set; }
        public bool IsAdmin
        {
            get
            {
                return (UserType == MemberTypeType.Admin);
            }
        }
    }
}
