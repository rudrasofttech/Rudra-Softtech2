using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class EmailMessage
    {
        [Key]
        public int ID { get; set; }
        [Required]
        public Guid PublicID { get; set; }
        [EmailAddress]
        [Required]
        public string FromAddress { get; set; }
        [EmailAddress]
        [Required]
        public string ToAddress { get; set; }
        [MaxLength(250)]
        [Required]
        public string Subject { get; set; }

        [Required]
        public string Message { get; set; }

        public bool IsRead { get; set; }
        public bool IsSent { get; set; }
        public DateTime SentDate { get; set; }
        public DateTime CreateDate { get; set; }
        public EmailMessageType EmailType { get; set; }
        [Required]
        [MaxLength(50)]
        public string EmailGroup { get; set; }
        public DateTime? ReadDate { get; set; }
        [MaxLength(500)]
        public string CCAddress { get; set; }
        [MaxLength(150)]
        public string ToName { get; set; }
        [MaxLength(150)]
        public string FromName { get; set; }

        public DateTime LastAttempt { get; set; }
    }
}
