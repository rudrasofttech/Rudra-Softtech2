using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RST.Data
{
    public class RSTInitializer : System.Data.Entity.DropCreateDatabaseIfModelChanges<RSTContext>
    {
        protected override void Seed(RSTContext context)
        {
        }
    }
}