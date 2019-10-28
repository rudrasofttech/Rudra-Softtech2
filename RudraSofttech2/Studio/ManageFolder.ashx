<%@ WebHandler Language="C#" Class="ManageFolder" %>

using System;
using System.Web;
using System.Web.Script.Serialization;
using System.IO;
using System.Collections.Generic;

public class ManageFolder : IHttpHandler
{
    HttpContext currentContext;
    public void ProcessRequest(HttpContext context)
    {
        currentContext = context;
        JavaScriptSerializer s = new JavaScriptSerializer();
        context.Response.ContentType = "text/json";
        if (string.IsNullOrEmpty(context.Request["action"]))
        {
            context.Response.Write(s.Serialize(new { result = false, message = "Action Missing" }));
        }
        else
        {
            string action = context.Request["action"].ToString();
            if (action == "create")
            {
                try
                {
                    string targetpath = context.Server.MapPath(context.Request["path"].ToString());
                    if (ValidateAccess(targetpath))
                    {
                        Directory.CreateDirectory(targetpath);
                        context.Response.Write(s.Serialize(new { result = true }));
                    }
                    else
                    {
                        context.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                    }
                }
                catch (Exception ex)
                {
                    context.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
                }
            }
            else if (action == "move")
            {
                try
                {
                    string spath = context.Server.MapPath(context.Request["spath"].ToString());
                    string tpath = context.Server.MapPath(context.Request["tpath"].ToString());
                    if (ValidateAccess(tpath) && ValidateAccess(spath))
                    {
                        Directory.Move(spath, tpath);
                        context.Response.Write(s.Serialize(new { result = true }));
                    }
                    else
                    {
                        context.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                    }
                }
                catch (Exception ex)
                {
                    context.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
                }
            }
            else if (action == "remove")
            {
                try
                {
                    string targetpath = context.Server.MapPath(context.Request["path"].ToString());
                    if (ValidateAccess(targetpath))
                    {
                        Directory.Delete(targetpath);
                        context.Response.Write(s.Serialize(new { result = true }));
                    }
                    else
                    {
                        context.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                    }
                }
                catch (Exception ex)
                {
                    context.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
                }
            }
        }
    }

    private bool ValidateAccess(string targetpath)
    {
        string rootPath = currentContext.Server.MapPath("~");
        List<string> restrictedPaths = new List<string>();

        restrictedPaths.Add(currentContext.Server.MapPath("~/Studio"));
        if (!targetpath.StartsWith(rootPath))
        {
            return false;
        }
        foreach (string path in restrictedPaths)
        {
            if (targetpath.ToLower().StartsWith(path.ToLower()))
            {
                return false;
            }
        }

        return true;
    }


    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}