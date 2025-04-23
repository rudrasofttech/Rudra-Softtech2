using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using RST.Context;
using RST.Model;
using RST.Web.Service;
using System.Runtime.CompilerServices;

namespace RST.Web.Pages.Blog
{
    public class DetailModel(ILogger<DetailModel> logger, RSTContext context, DataSourceService dataSourceService) : PageModel
    {
        private readonly ILogger<DetailModel> _logger = logger;
        private readonly RSTContext db = context;
        private readonly DataSourceService dsService = dataSourceService;


        public Post? PPM { get; set; }

        public void OnGet(string url, bool? preview)
        {
            try
            {
                PPM = db.Posts.FirstOrDefault(t => t.URL.ToLower() == url.ToLower().Trim() && (t.Status == PostStatus.Publish || (preview.HasValue && preview.Value)));
                if (PPM != null)
                {
                    #region Replace Custom Data Source
                    if (PPM.TemplateName != string.Empty)
                    {
                        var doc = new HtmlAgilityPack.HtmlDocument();
                        string templateHTML = dsService.LoadContent(PPM.TemplateName);
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
                    PPM.Article = dsService.ParseAndPopulate(PPM.Article);
                    #endregion
                }
            }
            catch (Exception ex) {
                _logger.LogError(ex, "Blog Details");
            }
        }
    }
}
