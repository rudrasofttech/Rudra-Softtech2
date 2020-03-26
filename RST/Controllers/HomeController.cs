using RST.Data;
using RST.Helper_Code;
using RST.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
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
            model.SiteHeader = Utility.GetSiteSetting("SiteHeader");
            return View(model);
        }

        public ActionResult Routine()
        {
            SendMail();

            System.Text.StringBuilder builder = new System.Text.StringBuilder();
            builder.Append(System.IO.File.ReadAllText(Server.MapPath("~/handlers/utility.js")).Replace("[rooturl]", string.Format("//{0}", Request.Url.Host)));
            //builder.Append(File.ReadAllText(context.Server.MapPath("~/handlers/vr.js")).Replace("[rooturl]", string.Format("//{0}",context.Request.Url.Host)));
            //builder.Append(File.ReadAllText(context.Server.MapPath("~/handlers/chat.js")).Replace("[rooturl]", string.Format("//{0}", context.Request.Url.Host)));
            return JavaScript(builder.ToString());
        }

        [HttpPost]
        public JsonResult ContactForm(ContactFormDTO obj)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(ModelState);
                }

                SendMessage(obj);
                return Json(new { status = "success", message = "We have received your message, shall contact you shortly." });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = "Unable to send message. " + ex.Message });
            }
        }

        public ActionResult ActivateEmail(string mail, string eid = "")
        {
            if (!string.IsNullOrEmpty(mail))
            {
                Member m = db.Members.FirstOrDefault(t => t.Email.ToLower() == mail.ToLower());
                if (m != null)
                {
                    m.Status = MemberStatus.Active;
                    m.ModifyDate = DateTime.Now;
                    db.SaveChanges();
                }
            }

            if (!string.IsNullOrEmpty(eid))
            {
                Guid publicid;
                if (Guid.TryParse(eid, out publicid))
                {
                    EmailMessage em = db.EmailMessages.FirstOrDefault(t => t.PublicID == publicid);
                    if (em != null)
                    {
                        em.IsRead = true;
                        em.ReadDate = DateTime.Now;
                        db.SaveChanges();
                    }
                }
            }
            return Redirect("~/home");
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

        [HttpPost]
        public JsonResult Subscribe(SubscribeDTO obj)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(ModelState);
                }

                if(db.Members.Count(t => t.Email.ToLower() == obj.Email.ToLower()) == 0)
                {
                    Member m = new Member() {
                        CreateDate = DateTime.Now,
                        Email = obj.Email,
                        FirstName = obj.Name,
                        Newsletter = true,
                        Password = "",
                        Status = MemberStatus.Inactive,
                        UserType = MemberTypeType.Reader
                    };
                    db.Members.Add(m);
                    db.SaveChanges();
                    string emessage = System.Web.Hosting.HostingEnvironment.MapPath("~/ActivationEmail.html");
                    string subject = "Activate Your Rudra Sofftech Subscription";
                    emessage = emessage.Replace("[name]", obj.Name);
                    emessage = emessage.Replace("[activateurl]", string.Format("https://www.rudrasofttech.com/activateemail?mail={0}", obj.Email));
                    emessage = emessage.Replace(System.Environment.NewLine, "<br/>");
                    EmailManager manager = new EmailManager(db);
                    manager.SendMail(Utility.NewsletterEmail, obj.Email, Utility.SiteName, obj.Name, emessage, subject, EmailMessageType.Activation, EmailMessageType.Activation.ToString());
                }
                else
                {
                    Member m = db.Members.FirstOrDefault(t => t.Email.ToLower() == obj.Email.ToLower());
                    m.Status = MemberStatus.Active;
                    m.ModifyDate = DateTime.Now;
                    db.SaveChanges();
                }
                
                return Json(new { status = "success", message = "" });
            }
            catch (Exception ex)
            {
                return Json(new { status = "error", message = "Unable to subscribe. " + ex.Message });
            }
        }

        private void SendMessage(ContactFormDTO obj)
        {
            EmailMessage em = new EmailMessage();
            em.CCAddress = string.Empty;
            em.CreateDate = DateTime.Now;
            em.EmailGroup = "ContactForm";
            em.EmailType = EmailMessageType.Communication;
            em.FromAddress = obj.Email;
            em.FromName = obj.Name;
            em.PublicID = Guid.NewGuid();
            em.Message = string.Format("Phone: {0} <br/>Email: {1} <br/> Website: {2} <br/> Purpose:<br />{4} <br/> Message:<br/> {3}",
                obj.Phone, obj.Email, obj.Website, obj.Message, obj.Purpose);
            em.Subject = string.Format("Message From {0}", obj.Name);
            em.ToAddress = Utility.NewsletterEmail;
            em.ToName = Utility.AdminName;
            EmailManager manager = new EmailManager(db);
            manager.AddMessage(em.PublicID, em.ToAddress, em.FromAddress, em.Subject, em.Message, em.EmailType, em.EmailGroup, em.CCAddress, em.ToName, em.FromName);
            manager.SendMail(em);
        }

        private void SendMail()
        {
            try
            {
                EmailManager manager = new EmailManager(db);
                for (int i = 0; i <= 3; i++)
                {
                    EmailMessage em = manager.GetUnsentMessage();
                    if (em != null)
                    {
                        manager.SendMail(em);
                    }
                }
            }
            catch (Exception)
            {
            }
        }
    }
}