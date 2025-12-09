using RST.Context;
using RST.Model;
using RST.Model.DTO;
using System.Net;
using System.Net.Mail;
using System.Security.Cryptography.Xml;
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
            var smtpClient = new SmtpClient(_config["SMTPSettings:host"], int.Parse(_config["SMTPSettings:port"] ?? "0"))
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

        public EmailMessage SendWebsiteActive(Member m, UserWebsite uw)
        {
            var builder = new StringBuilder();
            builder.Append($"<div style='margin-bottom:10px'>Hello {m.FirstName},</div>");

            if (uw.WSType == WebsiteType.VCard)
                builder.Append("<div style='margin-bottom:15px'>Your digital visiting card is active.</div>");
            else if (uw.WSType == WebsiteType.LinkList)
                builder.Append("<div style='margin-bottom:15px'>Your Link list is active.</div>");

            builder.Append($"<a style='border-radius:10px;background:#005551;color:#fff;padding:10px 15px;margin-bottom:30px;text-decoration:none;display:inline-block;' href='https://{uw.Name}.vc4.in' target='_blank'>https://{uw.Name}.vc4.in</a>");

            if (uw.WSType == WebsiteType.VCard)
                builder.Append("<div style='margin-bottom:15px;margin-top:15px;'>You can check the digital visiting card on the link provided above.</div>");
            else if (uw.WSType == WebsiteType.LinkList)
                builder.Append("<div style='margin-bottom:15px;margin-top:15px;'>You can check the link list on the link provided above.</div>");

            var sb = new StringBuilder();
            sb.Append(uw.Name);
            if (uw.WSType == WebsiteType.VCard)
                sb.Append(" visiting card is active");
            else if (uw.WSType == WebsiteType.LinkList)
                sb.Append(" link list is active");
            return SendEmail(m.Email, m.FirstName, $"{uw.Name} is active", builder.ToString(), "UserWebsite");
        }

        public EmailMessage SendRegistrationLink(Member m)
        {
            var builder = new StringBuilder();
            builder.Append($"<div style='margin-bottom:10px'>Welcome {m.FirstName},</div>");
            builder.Append("<div style='margin-bottom:15px'>You are now a registered member. Thanks for choosing Rudra Softtech LLP! We are happy to see you on board. You can use your account to access Ply.</div>");
            return SendEmail(m.Email, m.FirstName, "Registration Successful", builder.ToString(), "Registration");
        }

        public EmailMessage SendPasscode(Member m, string otp)
        {
            var builder = new StringBuilder();
            builder.Append($"<div style='margin-bottom:10px'>Dear {m.FirstName},</div>");
            builder.Append($"<div style='margin-bottom:15px'>Your account one time passcode is <strong>{otp}</strong>.<div>This is valid for 10 minutes.</div><div></div></div>");
            return SendEmail(m.Email, m.FirstName, "Rudra Softtech OTP", builder.ToString(), "OTP");
        }

    }

    public class SMSService(IConfiguration config)
    {
        private readonly IConfiguration _config = config;

        private (string CountryCode, string MobileNumber) ParsePhoneNumber(string phoneNumber)
        {
            // Assumes phoneNumber format: "countrycode-mobilenumber", e.g. "91-987500276"
            var parts = phoneNumber.Split('-', 2);
            if (parts.Length == 2)
            {
                return (parts[0], parts[1]);
            }
            // Fallback: treat entire string as mobile number, country code empty
            return ("", phoneNumber);
        }

        //public async Task<bool> SendSMSAsync(string phoneNumber, string message)
        //{
        //    var parsedNumber = ParsePhoneNumber(phoneNumber);
        //    string customerId = _config["MessageCentral:CustomerId"]; // supply actual customerId
        //    string key = _config["MessageCentral:Key"]; // supply actual key

        //    // Convert key to Base64
        //    string base64Key = Convert.ToBase64String(Encoding.UTF8.GetBytes(key));

        //    using (var client = new HttpClient())
        //    {
        //        client.DefaultRequestHeaders.Add("accept", "*/*");

        //        // Build the query string
        //        var url = $"https://cpaas.messagecentral.com/auth/v1/authentication/token" +
        //                  $"?scope=NEW&customerId={Uri.EscapeDataString(customerId)}" +
        //                  $"&key={Uri.EscapeDataString(base64Key)}";

        //        HttpResponseMessage authResponse = await client.GetAsync(url);

        //        if (authResponse.IsSuccessStatusCode)
        //        {
        //            string result = await authResponse.Content.ReadAsStringAsync();

        //            var resp = System.Text.Json.JsonSerializer.Deserialize<AuthResponseData>(result, new System.Text.Json.JsonSerializerOptions() { });
        //            if (resp != null && resp.Status == 200)
        //            {
        //                // Build the request URL with query parameters
        //                var url2 = $"https://cpaas.messagecentral.com/verification/v3/send" +
        //                          $"?countryCode={parsedNumber.CountryCode ?? "91"}&flowType=SMS&mobileNumber={Uri.EscapeDataString(parsedNumber.MobileNumber)}&senderId=RST&type=SMS&message={Uri.EscapeDataString(message)}&messageType=OTP";

        //                // Create the request
        //                var request = new HttpRequestMessage(HttpMethod.Post, url2);
        //                request.Headers.Add("authToken", resp.Token ?? string.Empty);

        //                // Send the request
        //                var response = await client.SendAsync(request);

        //                // Read the response
        //                string result2 = await response.Content.ReadAsStringAsync();

        //                if (!response.IsSuccessStatusCode)
        //                {
        //                    throw new Exception($"Error: {response.StatusCode}, Details: {result2}");
        //                }
        //                else
        //                {
        //                    var resp2 = System.Text.Json.JsonSerializer.Deserialize<MCApiResponse<SMSResponseData>>(result2);
        //                    if (resp2 != null && resp2.ResponseCode == 200)
        //                    {
        //                        return true;
        //                    }
        //                }
        //            }
        //        }
        //        else
        //        {
        //            string error = await authResponse.Content.ReadAsStringAsync();
        //            throw new Exception($"Error: {authResponse.StatusCode}, Details: {error}");
        //        }
        //        return false;
        //    }
        //}

        public async Task<bool> SendSMSAsync(string phoneNumber, string message)
        {
            var parsedNumber = ParsePhoneNumber(phoneNumber);
            string key = _config["2Factor:Key"]; // supply actual key

            // Convert key to Base64
            //string base64Key = Convert.ToBase64String(Encoding.UTF8.GetBytes(key));

            using (var client = new HttpClient())
            {
                //client.DefaultRequestHeaders.Add("accept", "*/*");

                // Build the query string
                var url = $"https://2factor.in/API/V1/{key}/SMS/{phoneNumber.Replace("-", "")}/{message}/{_config["2Factor:Template"]}";


                HttpResponseMessage authResponse = await client.GetAsync(url);

                if (authResponse.IsSuccessStatusCode)
                {
                    string result = await authResponse.Content.ReadAsStringAsync();

                    var resp = System.Text.Json.JsonSerializer.Deserialize<TwoFactorSMSResponse>(result, new System.Text.Json.JsonSerializerOptions() { });
                    if (resp != null && resp.Status == "Success")
                    {
                        return true;
                    }
                }
                else
                {
                    string error = await authResponse.Content.ReadAsStringAsync();
                    throw new Exception($"Error: {authResponse.StatusCode}, Details: {error}");
                }
                return false;
            }
        }
    }
}
