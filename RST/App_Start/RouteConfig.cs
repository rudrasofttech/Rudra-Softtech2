using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace RST
{
    public class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            
            

            routes.MapRoute(
                name: "BlogCatList",
                url: "blog/{category}/index",
                defaults: new { controller = "Blog", action = "CategoryList", category = UrlParameter.Optional}
            );
            routes.MapRoute(
                name: "BlogList",
                url: "blog",
                defaults: new { controller = "Blog", action = "List" }
            );
            routes.MapRoute(
                name: "BlogPost",
                url: "blog/{url}/{*preview}",
                defaults: new { controller = "Blog", action = "Index", url = UrlParameter.Optional, preview = UrlParameter.Optional }
            );
            
            routes.MapRoute(
                name: "Default",
                url: "{*pagename}",
                defaults: new { controller = "Home", action = "Index", pagename = UrlParameter.Optional }
            );
        }
    }
}
