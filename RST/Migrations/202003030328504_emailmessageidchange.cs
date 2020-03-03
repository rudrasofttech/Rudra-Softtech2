namespace RST.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class emailmessageidchange : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.EmailMessage", "PublicID", c => c.Guid(nullable: false));
        }
        
        public override void Down()
        {
            DropColumn("dbo.EmailMessage", "PublicID");
        }
    }
}
