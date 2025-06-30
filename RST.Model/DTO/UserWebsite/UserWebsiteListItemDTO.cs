using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace RST.Model.DTO.UserWebsite
{
    public class UserWebsiteListItemDTO
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public DateTime Created { get; set; }
        public DateTime? Modified { get; set; }
        public RecordStatus Status { get; set; } = RecordStatus.Active;
        public WebsiteType WSType { get; set; } = WebsiteType.None;
    }
}
