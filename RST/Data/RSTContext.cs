using System.Data.Entity;
using System.Data.Entity.ModelConfiguration.Conventions;
using RST.Models;

namespace RST.Data
{
    public class RSTContext : DbContext
    {
        public RSTContext() : base("RSTContext")
        {
            Database.SetInitializer<RSTContext>(null);
        }

        public DbSet<Category> Categories { get; set; }
        public DbSet<CustomDataSource> CustomDataSources { get; set; }
        public DbSet<CustomPage> CustomPages { get; set; }
        public DbSet<EmailMessage> EmailMessages { get; set; }
        public DbSet<Member> Members { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<TopStory> TopStories { get; set; }
        public DbSet<WebsiteSetting> WebsiteSettings { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Conventions.Remove<PluralizingTableNameConvention>();
        }
    }
}