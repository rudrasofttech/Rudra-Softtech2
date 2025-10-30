
using System.ComponentModel.DataAnnotations;

namespace RST.Model.VisitTracker
{
    public class Website
    {
        public int ID { get; set; }
        [MaxLength(50)]
        public string Name { get; set; } = null!;
        public int ClientID { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime? DateModified { get; set; }
        public int Status { get; set; }
        public Guid? OwnerId { get; set; }
    }
}
