<%@ WebHandler Language="C#" Class="FileData" %>

using System;
using System.Web;
using System.Web.Script.Serialization;
using System.IO;
using System.Collections.Generic;

public class FileData : IHttpHandler
{

    HttpContext currentContext;
    public void ProcessRequest(HttpContext context)
    {
        currentContext = context;
        JavaScriptSerializer s = new JavaScriptSerializer();
        context.Response.ContentType = "text/plain";

        if (string.IsNullOrEmpty(context.Request.QueryString["path"]))
        {
            context.Response.Write("");
        }
        else
        {
            if (File.Exists(context.Server.MapPath(context.Request.QueryString["path"].ToString())))
            {
                context.Response.Write(File.ReadAllText(context.Server.MapPath(context.Request.QueryString["path"].ToString())));
            }
            else
            {
                context.Response.Write("");
            }
        }
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}