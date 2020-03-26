using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using RST;
using RST.Models;
using System.Net.Mail;
using RST.Data;

namespace RST.Helper_Code
{
    public class EmailManager
    {
        RSTContext db;
        public EmailManager(RSTContext context)
        {
            db = context;
        }

        public bool SendMail(String fromAddress, String toAddress, String senderName, String recieverName, String body, String subject, EmailMessageType messageType, string emailGroup)
        {
            return SendMail(fromAddress, toAddress, senderName, recieverName, body, subject, string.Empty, messageType, emailGroup);
        }

        public bool SendMail(EmailMessage em)
        {
            try
            {
                MailMessage mail = new MailMessage();
                mail.To.Add(new MailAddress(em.ToAddress, em.ToName));
                if (em.CCAddress.Trim() != string.Empty)
                {
                    mail.CC.Add(em.CCAddress);
                }
                mail.From = new MailAddress(em.FromAddress, em.FromName);
                mail.Subject = em.Subject;
                mail.Body = em.Message;
                mail.IsBodyHtml = true;
                System.Net.Mail.SmtpClient client = new SmtpClient();
                client.Send(mail);
                try
                {
                    em.LastAttempt = DateTime.Now;
                    em.IsSent = true;
                    em.SentDate = DateTime.Now;
                    UpdateMessage(em);
                }
                catch
                {
                }
                return true;

            }
            catch (Exception ex)
            {
                try
                {
                    em.LastAttempt = DateTime.Now;
                    em.IsSent = false;
                    UpdateMessage(em);
                }
                catch
                {
                }
                return false;
            }
        }

        public bool SendMail(String fromAddress, String toAddress,
            String senderName, String recieverName, String body, String subject,
            string ccaddresses, EmailMessageType messageType, string emailGroup)
        {
            try
            {
                EmailMessage em = new EmailMessage();
                em.PublicID = Guid.NewGuid();

                string emessage = System.Web.Hosting.HostingEnvironment.MapPath("~/EmailWrapper.html");
                emessage = emessage.Replace("[root]", Utility.SiteURL);
                emessage = emessage.Replace("[newsletteremail]", Utility.NewsletterEmail);
                emessage = emessage.Replace("[message]", body);
                emessage = emessage.Replace("[id]", em.ID.ToString());
                emessage = emessage.Replace("[toaddress]", toAddress);
                emessage = emessage.Replace("[sitename]", Utility.SiteName);
                emessage = emessage.Replace("[sitetitle]", Utility.SiteTitle);
                emessage = emessage.Replace("[emailsignature]", Utility.GetSiteSetting("EmailSignature"));
                em.Message = emessage;

                em = AddMessage(em.PublicID, toAddress, fromAddress, subject, emessage, messageType, emailGroup, ccaddresses, recieverName, senderName);

                if (em != null)
                {
                    return SendMail(em);
                }
                else
                {
                    return false;
                }
            }
            catch (Exception ex)
            {
                HttpContext.Current.Trace.Write("Unable to send email.");
                HttpContext.Current.Trace.Write(ex.Message);
                HttpContext.Current.Trace.Write(ex.StackTrace);
                return false;
            }
        }

        public void UpdateMessage(EmailMessage em)
        {
            EmailMessage item = (from u in db.EmailMessages where u.ID == em.ID select u).SingleOrDefault();
            item.CreateDate = em.CreateDate;
            item.EmailGroup = em.EmailGroup;
            item.EmailType = em.EmailType;
            item.FromAddress = em.FromAddress;
            item.IsRead = em.IsRead;
            item.IsSent = em.IsSent;
            item.Message = em.Message;
            item.SentDate = em.SentDate;
            item.Subject = em.Subject;
            item.ToAddress = em.ToAddress;
            item.ReadDate = em.ReadDate;
            db.SaveChanges();
        }

        public EmailMessage GetMessage(Guid id)
        {
            EmailMessage em = (from u in db.EmailMessages where u.PublicID == id select u).SingleOrDefault();
            return em;
        }

        public EmailMessage GetUnsentMessage()
        {
            return (from u in db.EmailMessages where u.IsSent == false orderby u.LastAttempt ascending select u).FirstOrDefault();
        }

        /// <summary>
        /// Saves email message details to database
        /// </summary>
        /// <param name="toaddress"></param>
        /// <param name="fromaddress"></param>
        /// <param name="subject"></param>
        /// <param name="body"></param>
        /// <param name="messagetype"></param>
        /// <returns></returns>
        public EmailMessage AddMessage(Guid id,
            string toaddress,
            string fromaddress,
            string subject,
            string body,
            EmailMessageType messagetype,
            string emailGroup,
            string ccaddress,
            string toname,
            string fromname)
        {

            EmailMessage em = new EmailMessage()
            {
                PublicID = id,
                Message = body,
                FromAddress = fromaddress,
                EmailType = messagetype,
                Subject = subject,
                ToAddress = toaddress,
                SentDate = DateTime.Now,
                CreateDate = DateTime.Now,
                IsRead = false,
                IsSent = false,
                EmailGroup = emailGroup,
                CCAddress = ccaddress,
                ToName = toname,
                FromName = fromname,
                LastAttempt = DateTime.Now
            };
            db.EmailMessages.Add(em);
            db.SaveChanges();
            return em;

        }
    }
}