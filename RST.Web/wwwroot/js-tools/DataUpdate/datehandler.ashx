<%@ WebHandler Language="C#" Class="datehandler" %>

using System;
using System.Web;
using System.Web.Script.Serialization;

public class datehandler : IHttpHandler {
    
    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "text/json";
        JavaScriptSerializer s = new JavaScriptSerializer();
        context.Response.Write(s.Serialize(new { dt = DateTime.Now.ToString(), number = new Random().Next() }));
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}