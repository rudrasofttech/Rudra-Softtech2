using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net.Mail;

/// <summary>
/// Summary description for Utility
/// </summary>
public class Utility
{
    public static string AdminName { get { return "Raj Kiran Singh"; } }
    public static string AdminEmail { get { return "rajkiran.singh@gmail.com"; } }

    public static void SendEmail(string toemail, string toname, string fromemail, string fromname, string subject, string message)
    {

        MailMessage mail = new MailMessage();
        mail.To.Add(new MailAddress(toemail, toname));
        //if (em.CCAdress.Trim() != string.Empty)
        //{
        //    mail.CC.Add(em.CCAdress);
        //}
        mail.From = new MailAddress(fromemail, fromname);
        mail.Subject = subject;
        mail.Body = message;
        mail.IsBodyHtml = true;
        System.Net.Mail.SmtpClient client = new SmtpClient();
        client.Send(mail);
    }
}