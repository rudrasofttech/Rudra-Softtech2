namespace RST.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class First : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Category",
                c => new
                    {
                        ID = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 100),
                        UrlName = c.String(nullable: false, maxLength: 100),
                        Status = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.ID);
            
            CreateTable(
                "dbo.CustomDataSource",
                c => new
                    {
                        ID = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 100),
                        Query = c.String(nullable: false),
                        DateCreated = c.DateTime(nullable: false),
                        DateModified = c.DateTime(),
                        HtmlTemplate = c.String(),
                        CreatedBy_ID = c.Int(nullable: false),
                        ModifiedBy_ID = c.Int(),
                    })
                .PrimaryKey(t => t.ID)
                .ForeignKey("dbo.Member", t => t.CreatedBy_ID, cascadeDelete: true)
                .ForeignKey("dbo.Member", t => t.ModifiedBy_ID)
                .Index(t => t.CreatedBy_ID)
                .Index(t => t.ModifiedBy_ID);
            
            CreateTable(
                "dbo.Member",
                c => new
                    {
                        ID = c.Int(nullable: false, identity: true),
                        Email = c.String(nullable: false),
                        Password = c.String(nullable: false, maxLength: 100),
                        CreateDate = c.DateTime(nullable: false),
                        Newsletter = c.Boolean(nullable: false),
                        UserType = c.Int(nullable: false),
                        FirstName = c.String(maxLength: 200),
                        Status = c.Int(nullable: false),
                        LastLogon = c.DateTime(),
                        ModifyDate = c.DateTime(),
                        ModifiedBy_ID = c.Int(),
                    })
                .PrimaryKey(t => t.ID)
                .ForeignKey("dbo.Member", t => t.ModifiedBy_ID)
                .Index(t => t.ModifiedBy_ID);
            
            CreateTable(
                "dbo.CustomPage",
                c => new
                    {
                        ID = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false, maxLength: 200),
                        DateCreated = c.DateTime(nullable: false),
                        DateModified = c.DateTime(),
                        Status = c.Int(nullable: false),
                        Sitemap = c.Boolean(nullable: false),
                        Body = c.String(),
                        Head = c.String(),
                        NoTemplate = c.Boolean(nullable: false),
                        PageMeta = c.String(),
                        Title = c.String(),
                        CreatedBy_ID = c.Int(nullable: false),
                        ModifiedBy_ID = c.Int(),
                    })
                .PrimaryKey(t => t.ID)
                .ForeignKey("dbo.Member", t => t.CreatedBy_ID, cascadeDelete: true)
                .ForeignKey("dbo.Member", t => t.ModifiedBy_ID)
                .Index(t => t.CreatedBy_ID)
                .Index(t => t.ModifiedBy_ID);
            
            CreateTable(
                "dbo.EmailMessage",
                c => new
                    {
                        ID = c.Int(nullable: false, identity: true),
                        FromAddress = c.String(nullable: false),
                        ToAddress = c.String(nullable: false),
                        Subject = c.String(nullable: false, maxLength: 250),
                        Message = c.String(nullable: false),
                        IsRead = c.Boolean(nullable: false),
                        IsSent = c.Boolean(nullable: false),
                        SentDate = c.DateTime(nullable: false),
                        CreateDate = c.DateTime(nullable: false),
                        EmailType = c.Int(nullable: false),
                        EmailGroup = c.String(nullable: false, maxLength: 50),
                        ReadDate = c.DateTime(),
                        CCAddress = c.String(maxLength: 500),
                        ToName = c.String(maxLength: 150),
                        FromName = c.String(maxLength: 150),
                        LastAttempt = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.ID);
            
            CreateTable(
                "dbo.Post",
                c => new
                    {
                        ID = c.Int(nullable: false, identity: true),
                        Title = c.String(nullable: false, maxLength: 200),
                        DateCreated = c.DateTime(nullable: false),
                        DateModified = c.DateTime(),
                        Status = c.Int(nullable: false),
                        Tag = c.String(nullable: false, maxLength: 200),
                        Description = c.String(nullable: false, maxLength: 1000),
                        Article = c.String(nullable: false),
                        WriterName = c.String(nullable: false, maxLength: 100),
                        WriterEmail = c.String(nullable: false),
                        OGImage = c.String(maxLength: 300),
                        OGDescription = c.String(maxLength: 500),
                        MetaTitle = c.String(),
                        Viewed = c.Int(nullable: false),
                        URL = c.String(nullable: false, maxLength: 250),
                        TemplateName = c.String(),
                        Sitemap = c.Boolean(nullable: false),
                        Category_ID = c.Int(),
                        CreatedBy_ID = c.Int(),
                        ModifiedBy_ID = c.Int(),
                    })
                .PrimaryKey(t => t.ID)
                .ForeignKey("dbo.Category", t => t.Category_ID)
                .ForeignKey("dbo.Member", t => t.CreatedBy_ID)
                .ForeignKey("dbo.Member", t => t.ModifiedBy_ID)
                .Index(t => t.Category_ID)
                .Index(t => t.CreatedBy_ID)
                .Index(t => t.ModifiedBy_ID);
            
            CreateTable(
                "dbo.TopStory",
                c => new
                    {
                        ID = c.Int(nullable: false, identity: true),
                        DateCreated = c.DateTime(nullable: false),
                        CreatedBy_ID = c.Int(nullable: false),
                        Post_ID = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.ID)
                .ForeignKey("dbo.Member", t => t.CreatedBy_ID, cascadeDelete: true)
                .ForeignKey("dbo.Post", t => t.Post_ID, cascadeDelete: true)
                .Index(t => t.CreatedBy_ID)
                .Index(t => t.Post_ID);
            
            CreateTable(
                "dbo.WebsiteSetting",
                c => new
                    {
                        KeyName = c.String(nullable: false, maxLength: 50),
                        KeyValue = c.String(),
                        Description = c.String(),
                    })
                .PrimaryKey(t => t.KeyName);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.TopStory", "Post_ID", "dbo.Post");
            DropForeignKey("dbo.TopStory", "CreatedBy_ID", "dbo.Member");
            DropForeignKey("dbo.Post", "ModifiedBy_ID", "dbo.Member");
            DropForeignKey("dbo.Post", "CreatedBy_ID", "dbo.Member");
            DropForeignKey("dbo.Post", "Category_ID", "dbo.Category");
            DropForeignKey("dbo.CustomPage", "ModifiedBy_ID", "dbo.Member");
            DropForeignKey("dbo.CustomPage", "CreatedBy_ID", "dbo.Member");
            DropForeignKey("dbo.CustomDataSource", "ModifiedBy_ID", "dbo.Member");
            DropForeignKey("dbo.CustomDataSource", "CreatedBy_ID", "dbo.Member");
            DropForeignKey("dbo.Member", "ModifiedBy_ID", "dbo.Member");
            DropIndex("dbo.TopStory", new[] { "Post_ID" });
            DropIndex("dbo.TopStory", new[] { "CreatedBy_ID" });
            DropIndex("dbo.Post", new[] { "ModifiedBy_ID" });
            DropIndex("dbo.Post", new[] { "CreatedBy_ID" });
            DropIndex("dbo.Post", new[] { "Category_ID" });
            DropIndex("dbo.CustomPage", new[] { "ModifiedBy_ID" });
            DropIndex("dbo.CustomPage", new[] { "CreatedBy_ID" });
            DropIndex("dbo.Member", new[] { "ModifiedBy_ID" });
            DropIndex("dbo.CustomDataSource", new[] { "ModifiedBy_ID" });
            DropIndex("dbo.CustomDataSource", new[] { "CreatedBy_ID" });
            DropTable("dbo.WebsiteSetting");
            DropTable("dbo.TopStory");
            DropTable("dbo.Post");
            DropTable("dbo.EmailMessage");
            DropTable("dbo.CustomPage");
            DropTable("dbo.Member");
            DropTable("dbo.CustomDataSource");
            DropTable("dbo.Category");
        }
    }
}
