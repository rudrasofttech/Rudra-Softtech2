using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RST.Models
{
    public enum MemberStatus
    {
        Active = 0,
        Inactive = 1,
        Deleted = 2
    }

    public enum PostStatus
    {
        Draft = 1,
        Publish = 2,
        Inactive = 3
    }

    public enum MemberTypeType
    {
        Admin = 1,
        Editor = 2,
        Author = 3,
        Member = 4,
        Reader = 5,
        Demo = 6
    }

    public enum EmailMessageType
    {
        Activation = 1,
        Unsubscribe = 2,
        Newsletter = 3,
        ChangePassword = 4,
        Reminder = 5,
        Communication = 6
    }

    public class Member
    {
        [Key]
        public int ID { get; set; }
        [EmailAddress]
        [Required]
        public string Email { get; set; }
        [MaxLength(100)]
        [Required]
        public string Password { get; set; }
        public DateTime CreateDate { get; set; }
        public bool Newsletter { get; set; }
        public MemberTypeType UserType { get; set; }
        [MaxLength(200)]
        public string FirstName { get; set; }
        public MemberStatus Status { get; set; }
        public DateTime? LastLogon { get; set; }
        public DateTime? ModifyDate { get; set; }
        public Member ModifiedBy { get; set; }
    }

    public class Category
    {
        [Key]
        public int ID { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        [Required]
        [MaxLength(100)]
        public string UrlName { get; set; }
        public MemberStatus Status { get; set; }
    }

    public class CustomDataSource
    {
        [Key]
        public int ID { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        [Required]
        public string Query { get; set; }
        [Required]
        public DateTime DateCreated { get; set; }
        [Required]
        public Member CreatedBy { get; set; }
        public DateTime? DateModified { get; set; }
        public Member ModifiedBy { get; set; }
        public String HtmlTemplate { get; set; }
    }

    public class CustomDataSourceDTO
    {
        public int ID { get; set; }
        public string Name { get; set; }
        public string Query { get; set; }
        public DateTime DateCreated { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedByName { get; set; }
        public DateTime? DateModified { get; set; }
        public int ModifiedBy { get; set; }
        public string ModifiedByName { get; set; }
        public String HtmlTemplate { get; set; }
    }

    public class CustomPage
    {
        [Key]
        public int ID { get; set; }
        [MaxLength(200)]
        [Required]
        public string Name { get; set; }
        [Required]
        public DateTime DateCreated { get; set; }
        [Required]
        public Member CreatedBy { get; set; }
        public DateTime? DateModified { get; set; }
        public Member ModifiedBy { get; set; }
        public PostStatus Status { get; set; }
        public bool Sitemap { get; set; }
        public string Body { get; set; }
        public string Head { get; set; }
        public bool NoTemplate { get; set; }
        public string PageMeta { get; set; }
        public string Title { get; set; }
    }

    public class CustomPageDTO
    {
        public int ID { get; set; }
        public string Name { get; set; }
        public DateTime DateCreated { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedByName { get; set; }
        public DateTime? DateModified { get; set; }
        public int ModifiedBy { get; set; }
        public string ModifiedByName { get; set; }
        public String Status { get; set; }
        public bool Sitemap { get; set; }
        public string Body { get; set; }
        public string Head { get; set; }
        public bool NoTemplate { get; set; }
        public string PageMeta { get; set; }
        public string Title { get; set; }

        public CustomPageDTO()
        {
            Status = PostStatus.Draft.ToString();
            CreatedByName = "";
            ModifiedByName = "";
        }
    }

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

    public class EmailMessageListDTO
    {
        public List<EmailMessage> Messages { get; set; }
        public int TotalPages { get; set; }
        public int Page { get; set; }

        public EmailMessageListDTO()
        {
            Messages = new List<EmailMessage>();
        }
    }

    public class SendNewsletterDTO
    {
        public string EmailGroup { get; set; }
        public string Subject { get; set; }
    }

    public class MemberListDTO
    {
        public List<Member> Members { get; set; }
        public int TotalPages { get; set; }
        public int Page { get; set; }

        public MemberListDTO()
        {
            Members = new List<Member>();
        }
    }

    public class Post
    {
        [Key]
        public int ID { get; set; }
        [MaxLength(200)]
        [Required]
        public string Title { set; get; }
        public DateTime DateCreated { get; set; }
        public Member CreatedBy { get; set; }
        public DateTime? DateModified { get; set; }
        public Member ModifiedBy { get; set; }
        public PostStatus Status { get; set; }
        public Category Category { get; set; }
        [MaxLength(200)]
        [Required]
        public string Tag { get; set; }
        [MaxLength(1000)]
        [Required]
        public string Description { get; set; }
        [Required]
        public string Article { get; set; }
        [MaxLength(100)]
        [Required]
        public string WriterName { get; set; }
        [EmailAddress]
        [Required]
        public string WriterEmail { get; set; }
        [MaxLength(300)]
        public string OGImage { get; set; }
        [MaxLength(500)]
        public string OGDescription { get; set; }
        public string MetaTitle { get; set; }
        public int Viewed { get; set; }
        [MaxLength(250)]
        [Required]
        public string URL { get; set; }
        public string TemplateName { get; set; }
        public bool Sitemap { get; set; }
    }

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

    public class WebsiteSetting
    {
        [Key]
        [MaxLength(50)]
        public string KeyName { get; set; }
        public string KeyValue { get; set; }
        public string Description { get; set; }
    }

    public class PostDTO
    {
        public int ID { get; set; }
        public DateTime DateCreated { get; set; }
        public int CreatedBy { get; set; }
        public string CreatedByName { get; set; }
        public DateTime? DateModified { get; set; }
        public int ModifiedBy { get; set; }
        public string ModifiedByName { get; set; }
        public String Status { get; set; }
        public bool Sitemap { get; set; }
        public string Title { get; set; }
    }

    public class ChangePasswordDTO
    {
        [Required]
        public int MemberID { get; set; }
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; }
    }
}
