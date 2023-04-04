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
    public class BlogController : Controller
    {
        RSTContext db = new RSTContext();
        // GET: Blog
        public ActionResult List()
        {
            return View(db.Posts.ToList());
        }

        public ActionResult Index(string url, bool? preview)
        {
            Post PPM = db.Posts.FirstOrDefault(t => t.URL.ToLower() == url.ToLower().Trim() && (t.Status == Models.PostStatus.Publish || (preview.HasValue && preview.Value)));
            if (PPM != null)
            {
                #region Replace Custom Data Source
                DataSourceManager dsm = new DataSourceManager(db);

                if (PPM.TemplateName != string.Empty)
                {
                    HtmlAgilityPack.HtmlDocument doc = new HtmlAgilityPack.HtmlDocument();
                    string templateHTML = dsm.LoadContent(PPM.TemplateName);
                    doc.LoadHtml(templateHTML);

                    if (doc.DocumentNode.SelectNodes("//datasource") != null)
                    {
                        foreach (HtmlAgilityPack.HtmlNode ds in doc.DocumentNode.SelectNodes("//datasource"))
                        {
                            try
                            {
                                HtmlAgilityPack.HtmlAttribute att = ds.Attributes["name"];

                                if (att != null)
                                {
                                    var temp = doc.CreateElement("temp");
                                    var current = ds;
                                    if (att.Value == "articletext")
                                    {
                                        temp.InnerHtml = PPM.Article;
                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                    else if (att.Value == "articleimg")
                                    {
                                        if (PPM.OGImage != string.Empty)
                                            temp.InnerHtml = string.Format("<img src='{0}' alt='' />", PPM.OGImage);
                                        else
                                            temp.InnerHtml = "";

                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                    else if (att.Value == "articletitle")
                                    {
                                        temp.InnerHtml = PPM.Title;
                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                    else if (att.Value == "articledate")
                                    {
                                        temp.InnerHtml = PPM.DateCreated.ToShortDateString();
                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                    else if (att.Value == "articleviewcount")
                                    {
                                        temp.InnerHtml = PPM.Viewed.ToString();
                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                    else if (att.Value == "articletag")
                                    {
                                        temp.InnerHtml = PPM.Tag;
                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                    else if (att.Value == "articlewritername")
                                    {
                                        temp.InnerHtml = PPM.WriterName;
                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                    else if (att.Value == "articlewriteremail")
                                    {
                                        temp.InnerHtml = PPM.WriterEmail;
                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                    else if (att.Value == "articlecategory")
                                    {
                                        temp.InnerHtml = PPM.Category.Name;
                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                    else if (att.Value == "articledescription")
                                    {
                                        temp.InnerHtml = PPM.OGDescription;
                                        foreach (var child in temp.ChildNodes)
                                        {
                                            ds.ParentNode.InsertAfter(child, current);
                                            current = child;
                                        }
                                        ds.Remove();
                                    }
                                }
                            }
                            catch { }
                        }
                    }

                    PPM.Article = doc.DocumentNode.OuterHtml;
                }
                PPM.Article = dsm.ParseAndPopulate(PPM.Article);
                #endregion
            }
            else
            {
                PPM = new Post();
            }
            return View(PPM);
        }

        public ActionResult CategoryList(string category)
        {
            Category c = db.Categories.FirstOrDefault(t => t.UrlName.ToLower() == category.ToLower());
            if(c != null)
            {
                return View(db.Posts.Where(t => t.Category.ID == c.ID).ToList());
            }
            else
            {
                return View(new List<Post>());
            }
        }
    }
}