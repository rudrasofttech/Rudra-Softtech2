using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RST.Models
{
    public class ArticleDisplayModel
    {
        public Post Post { get; set; }
        public string CommonHeadContent { get; set; }
        public string SiteHeader { get; set; }
        public string SiteFooter { get; set; }
    }

    public class CustomPageDisplayModel
    {
        public CustomPage Page { get; set; }
        public string CommonHeadContent { get; set; }
        public string SiteHeader { get; set; }
        public string SiteFooter { get; set; }
    }
}