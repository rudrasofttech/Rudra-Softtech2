using RST.Model.Attributes;
using System.ComponentModel.DataAnnotations;

namespace RST.Model.DTO.UserWebsite
{
    public class CreateCanvasWebsiteDTO
    {
        [Required(ErrorMessage = "Website name is required.")]
        [MaxLength(150, ErrorMessage = "Website name cannot exceed 150 characters in length.")]
        [MinLength(3, ErrorMessage = "Website name must be minimum 3 characters.")]
        public string WebsiteName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Tag { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public DesignPublishStatus PublishStatus { get; set; } = DesignPublishStatus.Public;

        /// <summary>
        /// Raw JSON string representing the canvas elements/design data.
        /// Stored directly in UserWebsite.JsonData.
        /// </summary>
        [Required]
        public string JsonData { get; set; } = string.Empty;

        /// <summary>
        /// Base64 image string or URL for the canvas thumbnail.
        /// </summary>
        public string? Thumbnail { get; set; }
    }

    public class UpdateCanvasModel
    {
        [Required]
        public Guid Id { get; set; }

        [MaxLength(200)]
        public string Tag { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        public DesignPublishStatus PublishStatus { get; set; } = DesignPublishStatus.Public;

        /// <summary>
        /// Raw JSON string representing the canvas elements/design data.
        /// Stored directly in UserWebsite.JsonData.
        /// </summary>
        [Required]
        public string JsonData { get; set; } = string.Empty;

        /// <summary>
        /// Base64 image string or URL for the canvas thumbnail.
        /// Null or empty means remove the existing thumbnail.
        /// </summary>
        public string? Thumbnail { get; set; }
    }
}