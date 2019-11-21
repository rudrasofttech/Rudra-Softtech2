<%@ WebHandler Language="C#" Class="Auth" %>

using System;
using System.Web;
using System.Web.Script.Serialization;
using System.Security.Cryptography;

using System.Text;

public class Auth : IHttpHandler
{
    HttpContext currentContext;
    JavaScriptSerializer s = new JavaScriptSerializer();
    public void ProcessRequest(HttpContext context)
    {
        currentContext = context;

        //context.Response.Write(HashPassword(context.Request["u"]));
        //context.Response.End();
        if (string.IsNullOrEmpty(context.Request["u"]) || string.IsNullOrEmpty(context.Request["p"]))
        {
            context.Response.ContentType = "text/json";
            context.Response.Write(s.Serialize(new { result = false, message = "Credentials Missing" }));
            context.Response.StatusCode = 400;
            context.Response.End();
        }
        else
        {
            if (HashPassword(context.Request["u"].ToString()) == "PKclIFPn6KPjeF+m5dKqroT5K3eK9Jdl+4Xt+Ser+zI=" &&
                    HashPassword(context.Request["p"].ToString()) == "tivOGIGoCfr7DrVun561xGy/EkAkeLXrSi6KEQx9bJE=")
            {
                Guid id = Guid.NewGuid();
                SaveToken(id.ToString(), DateTime.Now.AddHours(2), "admin");
                context.Response.ContentType = "text/json";
                context.Response.Write(s.Serialize(new { result = true, token = id.ToString() }));
            }
            else if (HashPassword(context.Request["u"].ToString()) == "KpdRbDVLaISM29j1SiJqClWyHtE44getbFy7nACqWuo=" &&
                   HashPassword(context.Request["p"].ToString()) == "KpdRbDVLaISM29j1SiJqClWyHtE44getbFy7nACqWuo=")
            {
                Guid id = Guid.NewGuid();
                SaveToken(id.ToString(), DateTime.Now.AddMinutes(30), "demo");
                context.Response.ContentType = "text/json";
                context.Response.Write(s.Serialize(new { result = true, token = id.ToString() }));
            }
            else
            {
                context.Response.ContentType = "text/json";
                context.Response.Write(s.Serialize(new { result = false, message = "Invalid Credentials" }));
                context.Response.StatusCode = 400;
            }
        }
    }

    string HashPassword(string pasword)
    {
        byte[] arrbyte = new byte[pasword.Length];
        SHA256 hash = new SHA256CryptoServiceProvider();
        arrbyte = hash.ComputeHash(Encoding.UTF8.GetBytes(pasword));
        return Convert.ToBase64String(arrbyte);
    }

    void SaveToken(string id, DateTime expiry, string role)
    {
        StringBuilder sb = new StringBuilder();
        sb.AppendLine(role);
        sb.AppendLine(expiry.ToString());
        System.IO.File.WriteAllText(currentContext.Server.MapPath("~/studio/token/" + id + ".txt"), sb.ToString());
    }
    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}