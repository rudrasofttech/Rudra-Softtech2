using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using RST.Helper_Code;

namespace RST.Controllers
{
    public class UtilityController : Controller
    {
        // GET: Utility
        public JsonResult Slugify(int id, string t)
        {
            return Json(new { d = Utility.Slugify(t) });
        }
    }
}