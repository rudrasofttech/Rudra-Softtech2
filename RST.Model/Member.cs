using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RST.Model
{
    public class Member
    {
        [JsonIgnore]
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
        [JsonIgnore]
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
        public bool Newsletter { get; set; }
        public MemberTypeType UserType { get; set; }
        [MaxLength(200)]
        public string FirstName { get; set; } = string.Empty;
        [JsonIgnore]
        public RecordStatus Status { get; set; }
        public DateTime? LastLogon { get; set; }
        [JsonIgnore]
        public DateTime? ModifyDate { get; set; }
        [JsonIgnore]
        public Member? ModifiedBy { get; set; }

        public DateTime? LastLoginAttempt { get; set; }
        [JsonIgnore]
        public int InvalidAttemptCount { get; set; }
        public bool IsAdmin
        {
            get
            {
                return (UserType == MemberTypeType.Admin);
            }
        }

        public Guid PublicID { get; set; } = Guid.NewGuid();
        [MaxLength(50)]
        public string Phone { get; set; } = string.Empty;
    }

    public class Passcode
    {
        public Guid ID { get; set; } = Guid.NewGuid();            
        public byte[] OTP { get; set; } = []; 
        public int MemberID { get; set; }

        [ForeignKey(nameof(MemberID))]
        public Member Member { get; set; } = null!;
        public DateTime Expiry { get; set; } = DateTime.UtcNow.AddMinutes(10);
        public DateTime CreateDate { get; set; }  = DateTime.UtcNow;
        public PasscodePurpose Purpose { get; set; } = PasscodePurpose.TwoFactorAuthentication;
        [NotMapped]
        public string OTPDisplay { get; set; }
    }

    public enum PasscodePurpose
    {
        AccountVerification = 3,
        PasswordReset = 2,
        TwoFactorAuthentication = 1
    }
}
