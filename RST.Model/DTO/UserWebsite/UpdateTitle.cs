using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model.DTO.UserWebsite
{
    public class UpdateVCardModel
    {
        [Required]
        public Guid Id { get; set; }
        [Required]
        public string FieldName { get; set; } = string.Empty;
        public string FieldValue{ get; set; } = string.Empty;
    }
}
