<%@ WebHandler Language="C#" Class="HTMLEncoder" %>

using System;
using System.Web;

public class HTMLEncoder : IHttpHandler {
    
    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "text/plain";
        string result = string.Empty;
        try
        {
            if (context.Request["inputhtml"] != null)
            {
                result = context.Server.HtmlEncode(context.Request["inputhtml"]);
                context.Response.Write(result);
            }
        }
        catch (Exception ex) {
            context.Trace.Write("Unable to encode HTML");
            context.Trace.Write(ex.Message);
            context.Trace.Write(ex.StackTrace);
            context.Trace.Write(ex.Source);
            context.Response.Write("");
        }
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}