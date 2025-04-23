using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class TopStory
    {
        [Key]
        public int ID { get; set; }
        [Required]
        public Post Post { get; set; }
        [Required]
        public Member CreatedBy { get; set; }
        [Required]
        public DateTime DateCreated { get; set; }
    }
}
