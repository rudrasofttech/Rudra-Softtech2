using RST.Model.Attributes;
using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    public class CreateUserWebsiteDTO
    {
        [Required(ErrorMessage = "Page name is required.")]
        [MaxLength(50, ErrorMessage = "Page name cannot exceed 50 characters.")]
        [MinLength(3, ErrorMessage = "Page name must be at least 3 characters long.")]
        [DomainSafeName]
        public string Name { get; set; } = string.Empty;
        [Required]
        public WebsiteType WSType { get; set; }
        public string TemplateHtml { get; set; } = string.Empty;
        public string JsonData { get; set; } = string.Empty;
        public string HTML { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Tag { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public DesignPublishStatus PublishStatus { get; set; } = DesignPublishStatus.Public;
    }

    public class UpdateUserWebsiteDTO {

        [Required]
        public Guid Id { get; set; }

        [Required(ErrorMessage = "Page name is required.")]
        [MaxLength(50, ErrorMessage = "Page name cannot exceed 50 characters.")]
        [MinLength(3, ErrorMessage = "Page name must be at least 3 characters long.")]
        [DomainSafeName]
        public string Name { get; set; } = string.Empty;

        [Required]
        public WebsiteType WSType { get; set; }
        public string TemplateHtml { get; set; } = string.Empty;
        public string JsonData { get; set; } = string.Empty;
        public string HTML { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Tag { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public DesignPublishStatus PublishStatus { get; set; } = DesignPublishStatus.Public;
    }

    public class AddWebsiteModel
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
    }

    public class RemoveWebsiteModel
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
    }

    public class AddWebsiteResponse
    {
        public string? Message { get; set; }
        public int? WebsiteId { get; set; }
        public string? Script { get; set; }
    }
}
