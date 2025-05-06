using Microsoft.AspNetCore.Mvc;
using RST.Context;
using RST.Model;
using System.Net.Mail;
using System.Net;
using RST.Web.Pages.Blog;
using System.Text;

namespace RST.Web.Service
{
    public class EmailService(RSTContext context, WebsiteSettingsService wsService, IWebHostEnvironment environment, IConfiguration config)
    {
        private readonly IWebHostEnvironment _environment = environment;
        private readonly RSTContext db = context;
        private readonly WebsiteSettingsService _wsService = wsService;
        private readonly IConfiguration _config = config;

        public EmailMessage SendEmail(string toEmail, string toName, string subject, string message, string emailGroup)
        {


            string newsletteremail = _wsService.NewsletterEmail;
            string sitename = _wsService.SiteName;
            string sitetitle = _wsService.SiteTitle;
            string siteurl = _wsService.SiteURL;
            string emailSignature = _wsService.GetSiteSetting("EmailSignature");
            var em = new EmailMessage
            {
                CCAddress = string.Empty,
                CreateDate = DateTime.UtcNow,
                SentDate = DateTime.UtcNow,
                EmailGroup = emailGroup.Trim(),
                EmailType = EmailMessageType.ChangePassword,
                FromAddress = newsletteremail,
                FromName = sitename,
                LastAttempt = DateTime.UtcNow,
                Subject = subject,
                ToAddress = toEmail,
                ToName = toName,
                Message = message,
                PublicID = Guid.NewGuid()
            };
            string emessage = System.IO.File.ReadAllText($"{_environment.WebRootPath}/EmailWrapper.html");
            emessage = emessage.Replace("[root]", siteurl);
            emessage = emessage.Replace("[id]", em.ID.ToString());
            emessage = emessage.Replace("[newsletteremail]", newsletteremail);
            emessage = emessage.Replace("[message]", em.Message);
            emessage = emessage.Replace("[toaddress]", em.ToAddress);
            emessage = emessage.Replace("[sitename]", sitename);
            emessage = emessage.Replace("[sitetitle]", sitetitle);
            emessage = emessage.Replace("[emailsignature]", emailSignature);
            em.Message = emessage;

            // Set up the SmtpClient
            var smtpClient = new SmtpClient(_config["SMTPSettings:host"], int.Parse(_config["SMTPSettings:port"]))
            {
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_config["SMTPSettings:username"], _config["SMTPSettings:password"]),
                EnableSsl = true
            };

            // Create the email message
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_wsService.ContactEmail),
                Subject = em.Subject,
                Body = em.Message,
                IsBodyHtml = true
            };
            mailMessage.To.Add(new MailAddress(em.ToAddress, em.ToName));
            
            // Send the email
            smtpClient.Send(mailMessage);
            em.IsSent = true;
            em.SentDate = DateTime.UtcNow;
            db.EmailMessages.Add(em);

            db.SaveChanges();
            return em;
        }

        public EmailMessage SendResetPasswordLink(Member m, ResetPasswordLink rpl)
        {
            var builder = new StringBuilder();
            builder.Append($"<div style='margin-bottom:10px'>Hello {m.FirstName},</div>");
            builder.Append("<div style='margin-bottom:15px'>Please click the link provided bellow to reset your password.</div>");
            builder.Append($"<a style='border-radius:10px;background:#005551;color:#fff;padding:10px 15px;margin-bottom:30px;text-decoration:none;display:inline-block;' href='https://www.rudrasofttech.com/account/resetpassword/{rpl.ID}' target='_blank'>Reset Password Link</a>");
            builder.Append("<div style='margin-bottom:20px; margin-bottom:20px'>In case above link is not working. Please copy the address mentioned bellow in your favourite web browser.</div>");
            builder.Append($"<div style='margin-bottom:30px'>https://www.rudrasofttech.com/account/resetpassword/{rpl.ID}</div>");
            return SendEmail(m.Email, m.FirstName, "Reset Password Link of Rudra Softtech Account", builder.ToString(), "ResetPassword");
        }
    }
}
