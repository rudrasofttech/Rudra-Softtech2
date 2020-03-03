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
    }
}