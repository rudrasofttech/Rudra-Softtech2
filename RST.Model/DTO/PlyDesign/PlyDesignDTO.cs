using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.PlyDesign
{
    public class CreatePlyDesignDTO
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Tag { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string JsonData { get; set; } = string.Empty;

        public string? Thumbnail { get; set; } = string.Empty;
    }

    public class UpdatePlyDesignDTO
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Tag { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string JsonData { get; set; } = string.Empty;

        public string? Thumbnail { get; set; } = string.Empty;
    }

    public class PlyDesignListItemDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Tag { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Thumbnail { get; set; } = string.Empty;
        public DateTime Created { get; set; }
        public DateTime? Modified { get; set; }
        public RecordStatus Status { get; set; }
        public string OwnerName { get; set; } = string.Empty;
    }
}