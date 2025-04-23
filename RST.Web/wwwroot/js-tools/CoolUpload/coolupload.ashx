<%@ WebHandler Language="C#" Class="coolupload" %>

using System;
using System.Web;
using System.Web.Script.Serialization;
using System.IO;

public class coolupload : IHttpHandler
{
    HttpContext currentContext;
    JavaScriptSerializer s = new JavaScriptSerializer();
    string action = string.Empty;
    string path = string.Empty;
    string fileType = ".txt";


    public void ProcessRequest(HttpContext context)
    {
        currentContext = context;
        context.Response.ContentType = "text/json";

        if (!ValidateInput()) { return; }

        if (action == "naming")
        {
            SetFileName();
        }
        else if (action == "fullupload")
        {
            FullUpload();
        }

    }

    private void FullUpload()
    {
        string uploadpath = ""; bool generatename = false;
        string index;
        if (currentContext.Request["uploadpath"] != null)
        {
            if (currentContext.Request["uploadpath"].Trim() != "")
            {
                uploadpath = currentContext.Request["uploadpath"].Trim();
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { status = false, message = "Upload Path missing" }));
                return;
            }
        }
        else
        {
            currentContext.Response.Write(s.Serialize(new { status = false, message = "Upload Path missing" }));
            return;
        }


        if (currentContext.Request["generatename"] != null)
        {
            if (!bool.TryParse(currentContext.Request["generatename"], out generatename))
            {
                generatename = false;
            }
        }


        if (currentContext.Request.Files.Count == 0)
        {
            currentContext.Response.Write(s.Serialize(new { status = false, message = "File missing" }));
            return;
        }
        else if (currentContext.Request.Files.Count > 1)
        {
            currentContext.Response.Write(s.Serialize(new { status = false, message = "Too Many Files" }));
            return;
        }

        if (currentContext.Request["index"] != null)
        {
            if (currentContext.Request["index"].Trim() != "")
            {
                index = currentContext.Request["index"].Trim();
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { status = false, message = "File upload sequence index missing" }));
                return;
            }
        }
        else
        {
            currentContext.Response.Write(s.Serialize(new { status = false, message = "File upload sequence index missing" }));
            return;
        }

        try
        {
            string newname = currentContext.Request.Files[0].FileName;
            FileInfo fi = new FileInfo(currentContext.Request.Files[0].FileName);
            string ext = fi.Extension;
            if (generatename)
            {
                newname = string.Format("{2}{0}{1}", Guid.NewGuid().ToString().Replace("-", ""), ext, uploadpath);
            }
            else
            {
                newname = string.Format("{0}{1}", uploadpath, newname);
            }
            throw new Exception("Due to security reason, Cool Upload Demo is not allowed to save file on the server. Plugin developer has taken this precaution to stop the misuse of the demo by hackers.");
            //try to create target directory if does not exist
            if (!Directory.Exists(currentContext.Server.MapPath(uploadpath)))
            {
                Directory.CreateDirectory(currentContext.Server.MapPath(uploadpath));
            }
            
            currentContext.Request.Files[0].SaveAs(currentContext.Server.MapPath(newname));
            if (File.Exists(currentContext.Server.MapPath(newname)))
            {
                currentContext.Response.Write(s.Serialize(new { status = true, filepath = System.Web.VirtualPathUtility.ToAbsolute(newname), index = index, filetype = ext.ToLower() }));
                return;
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { status = false, message = "Failed", index = index }));
                return;
            }
        }
        catch (Exception ex)
        {
            currentContext.Response.Write(s.Serialize(new { status = false, message = ex.Message, index = index }));
            return;
        }

    }

    private void SetFileName()
    {
        string name = "";
        if (currentContext.Request["filename"] != null)
        {
            if (currentContext.Request["filename"].Trim() != "")
            {
                name = currentContext.Request["filename"].Trim();
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { status = false, message = "Filename missing" }));
                return;
            }
        }
        else
        {
            currentContext.Response.Write(s.Serialize(new { status = false, message = "Filename missing" }));
            return;
        }


        //if (name == "") { name = Guid.NewGuid().ToString().Replace("-", ""); }
        FileInfo fi = new FileInfo(name);
        string ext = fi.Extension;

        string newname = string.Format("{0}{1}", Guid.NewGuid().ToString().Replace("-", ""), ext);

        currentContext.Response.Write(s.Serialize(new { status = true, newname = newname }));
    }

    private bool ValidateInput()
    {
        if (currentContext.Request["action"] != null)
        {
            if (currentContext.Request["action"].Trim() == string.Empty)
            {
                currentContext.Response.Write(s.Serialize(new { status = false, message = "action missing" }));

                return false;
            }
            else
            {
                action = currentContext.Request["action"].Trim();
            }
        }
        else
        {
            return false;
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