using Microsoft.EntityFrameworkCore;
using RST.Model;
using RST.Model.VisitTracker;

namespace RST.Context
{
    public class RSTContext : DbContext
    {
        public RSTContext()
        {
        }

        public RSTContext(DbContextOptions<RSTContext> options)
            : base(options)
        {
        }

        public virtual DbSet<EmailMessage> EmailMessages { get; set; }
        public virtual DbSet<Member> Members { get; set; }
        public virtual DbSet<Post> Posts { get; set; }
        public virtual DbSet<ResetPasswordLink> ResetPasswordLinks { get; set; }
        public virtual DbSet<AccountVerificationLink> AccountVerificationLinks { get; set; }
        public virtual DbSet<TopStory> TopStories { get; set; }
        public virtual DbSet<WebsiteSetting> WebsiteSettings { get; set; }
        public virtual DbSet<Captcha> Captchas { get; set; }
        public virtual DbSet<Category> Categories { get; set; }

        public virtual DbSet<CustomDataSource> CustomDataSources { get; set; }
        public virtual DbSet<CustomPage> CustomPages { get; set; }
        public virtual DbSet<UserWebsite> UserWebsites { get; set; }
        public virtual DbSet<UserWebsiteTheme> UserWebsiteThemes { get; set; }
        public virtual DbSet<Passcode> Passcodes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("dbo");
            modelBuilder.Entity<CustomPage>().ToTable("CustomPage");
            modelBuilder.Entity<CustomDataSource>().ToTable("CustomDataSource");
            modelBuilder.Entity<Captcha>().ToTable("Captcha");
            modelBuilder.Entity<Category>().ToTable("Category");
            modelBuilder.Entity<EmailMessage>().ToTable("EmailMessage");
            modelBuilder.Entity<Member>().ToTable("Member");
            modelBuilder.Entity<Post>().ToTable("Post");
            modelBuilder.Entity<ResetPasswordLink>().ToTable("ResetPasswordLink");
            modelBuilder.Entity<AccountVerificationLink>().ToTable("AccountVerificationLink");
            modelBuilder.Entity<TopStory>().ToTable("TopStory");
            modelBuilder.Entity<WebsiteSetting>(entity =>
            {
                entity.HasKey(e => e.KeyName).HasName("PK_RockyingSetting");

                entity.ToTable("WebsiteSetting");

                entity.Property(e => e.KeyName).HasMaxLength(50);
            });
            modelBuilder.Entity<UserWebsite>().ToTable("UserWebsite");
            modelBuilder.Entity<UserWebsiteTheme>().ToTable("UserWebsiteTheme");
            modelBuilder.Entity<Passcode>().ToTable("Passcode");
        }
    }

    public class VisitDbContext : DbContext {
        public VisitDbContext()
        {
        }

        public VisitDbContext(DbContextOptions<VisitDbContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Website> Websites { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("dbo");
            modelBuilder.Entity<Website>().ToTable("Website");
        }
    }
}
