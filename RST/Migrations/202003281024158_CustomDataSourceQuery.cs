namespace RST.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class CustomDataSourceQuery : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.CustomDataSource", "Query", c => c.String());
        }
        
        public override void Down()
        {
            AlterColumn("dbo.CustomDataSource", "Query", c => c.String(nullable: false));
        }
    }
}
