using RST.Data;
using RST.Helper_Code;
using RST.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace RST.Controllers
{
    public class HomeController : Controller
    {
        RSTContext db = new RSTContext();
        public ActionResult Index(string pagename)
        {
            if (string.IsNullOrEmpty(pagename))
            {
                pagename = "home";
            }
            CustomPage cp = db.CustomPages.FirstOrDefault(t => t.Name.ToLower() == pagename.ToLower());
            CustomPageDisplayModel model = new CustomPageDisplayModel();
            model.Page = (cp == null) ? new CustomPage() : cp;
            model.CommonHeadContent = Utility.GetSiteSetting("CommonHeadContent");
            model.SiteFooter = Utility.GetSiteSetting("SiteFooter");
            model.SiteHeader =  Utility.GetSiteSetting("SiteHeader");
            return View(model);
        }

        public ActionResult Routine()
        {
            return View();
        }

        public ActionResult GenerateSitemap()
        {
            System.Text.StringBuilder builder = new System.Text.StringBuilder();
            builder.Append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            builder.Append("<urlset xmlns=\"http://www.google.com/schemas/sitemap/0.9\">");

            //Add Home Page and other static pages
            builder.Append("<url>");
            builder.Append(string.Format("<loc>{0}/</loc>", Utility.SiteURL));
            builder.Append("</url>");

            builder.Append("<url>");
            builder.Append(string.Format("<loc>{0}/blog</loc>", Utility.SiteURL));
            builder.Append("</url>");

            builder.Append("<url>");
            builder.Append(string.Format("<loc>{0}/cart/orderlist.aspx</loc>", Utility.SiteURL));
            builder.Append("</url>");
            builder.Append("<url>");
            builder.Append(string.Format("<loc>{0}/cart/cart.aspx</loc>", Utility.SiteURL));
            builder.Append("</url>");

            foreach (Category c in Utility.CategoryList())
            {
                if (c.Status == (byte)MemberStatus.Active)
                {
                    builder.Append("<url>");
                    builder.Append(string.Format("<loc>{1}/blog/{0}/index</loc>", c.UrlName, Utility.SiteURL));
                    builder.Append("</url>");
                }
            }


            var cp = db.CustomPages.Where(t => t.Status == PostStatus.Publish && t.Sitemap);  //from u in db.CustomPages where u.Status == (byte)PostStatusType.Publish && u.Sitemap select u;
                foreach (var i in cp)
                {
                    builder.Append("<url>");
                    builder.Append(string.Format("<loc>{1}/{0}</loc>", i.Name, Utility.SiteURL));
                    builder.Append("</url>");
                }

                var p = db.Posts.Where(t => t.Status == PostStatus.Publish && t.Sitemap).OrderByDescending(t => t.DateCreated);  
                foreach (var i in p)
                {
                    builder.Append("<url>");
                    builder.Append(string.Format("<loc>{0}</loc>", Utility.GenerateBlogArticleURL(i, Utility.SiteURL)));
                    builder.Append("</url>");
                }
            

            builder.Append("</urlset>");

            System.IO.File.WriteAllText(Server.MapPath("~/sitemap.xml"), builder.ToString());

            return new HttpStatusCodeResult(200);
        }
    }
}