<%@ WebHandler Language="C#" Class="StudioWorker" %>

using System;
using System.Web;
using System.Web.Script.Serialization;
using System.IO;
using System.Collections.Generic;

public class StudioWorker : IHttpHandler
{
    HttpContext currentContext;
    string action = "";
    string role = "";

    JavaScriptSerializer s = new JavaScriptSerializer();

    public void ProcessRequest(HttpContext context)
    {
        currentContext = context;
        context.Response.ContentType = "text/json";
        if (String.IsNullOrEmpty(context.Request.Headers["Auth-Token"]))
        {
            if (!Authenticate(context.Request.Headers["Auth-Token"]))
            {
                context.Response.Write(s.Serialize(new { result = false, message = "Unauthorized" }));
                context.Response.StatusCode = 401;
                context.Response.End();
            }
        }
        else
        {
            context.Response.Write(s.Serialize(new { result = false, message = "Unauthorized" }));
            context.Response.StatusCode = 401;
            context.Response.End();
        }

        if (string.IsNullOrEmpty(context.Request["action"]))
        {
            context.Response.Write(s.Serialize(new { result = false, message = "Action Missing" }));
            context.Response.StatusCode = 400;
            context.Response.End();
        }
        else
        {
            action = context.Request["action"].ToString();
        }

        switch (action)
        {
            case "dirlist":
                if (role == "admin" || role == "demo")
                {
                    GetDirectoryTree();
                }
                break;
            case "createfile":
                if (role == "admin")
                {
                    CreateFile();
                }
                break;
            case "renamefile":
                if (role == "admin")
                {
                    RenameFile();
                }
                break;
            case "removefile":
                if (role == "admin")
                {
                    RemoveFile();
                }
                break;
            case "createdir":
                if (role == "admin")
                {
                    CreateDirectory();
                }
                break;
            case "renamedir":
                if (role == "admin")
                {
                    RenameDirectory();
                }
                break;
            case "removedir":
                if (role == "admin")
                {
                    RemoveDirectory();
                }
                break;
            case "savedata":
                if (role == "admin")
                {
                    SaveFileData();
                }
                break;
            case "getdata":
                if (role == "admin" || role == "demo")
                {
                    GetFileData();
                }
                break;
            default:
                context.Response.Write(s.Serialize(new { result = false, message = "" }));
                context.Response.StatusCode = 400;
                context.Response.End();
                break;
        }

    }

    private bool Authenticate(string token)
    {
        if (File.Exists(currentContext.Server.MapPath(string.Format("~/studio/token/{0}.txt", token))))
        {
            string[] lines = File.ReadAllLines(currentContext.Server.MapPath(string.Format("~/studio/token/{0}.txt", token)));
            if (lines.Length == 2)
            {
                DateTime expiry;
                if (DateTime.TryParse(lines[1], out expiry))
                {
                    if (expiry > DateTime.Now)
                    {
                        role = lines[0];
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private void GetDirectoryTree()
    {
        try
        {
            DirectoryItem di = new DirectoryItem();
            di.Name = "";
            di.IsFile = false;
            di.Path = "~";
            di = BuildDirectoryItemTree(di);
            currentContext.Response.Write(s.Serialize(di));
        }
        catch (Exception ex)
        {
            currentContext.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
            currentContext.Response.StatusCode = 500;
        }
        currentContext.Response.End();
    }

    private void CreateFile()
    {
        try
        {
            string targetpath = currentContext.Server.MapPath(currentContext.Request["path"].ToString());
            if (ValidateAccess(targetpath))
            {
                File.WriteAllText(targetpath, "");
                FileInfo di = new FileInfo(targetpath);
                currentContext.Response.Write(s.Serialize(new
                {
                    result = true,
                    item = new
                    {
                        Path = currentContext.Request["path"].ToString(),
                        Name = di.Name,
                        CreateDate = di.CreationTime.ToString(),
                        LastAccessDate = di.LastAccessTime.ToString(),
                        LastWriteDate = di.LastWriteTime.ToString(),
                        IsFile = true
                    }
                }));
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                currentContext.Response.StatusCode = 403;
            }
        }
        catch (Exception ex)
        {
            currentContext.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
            currentContext.Response.StatusCode = 500;
        }
    }

    private void RenameFile()
    {
        try
        {
            string spath = currentContext.Server.MapPath(currentContext.Request["spath"].ToString());
            string tpath = currentContext.Server.MapPath(currentContext.Request["tpath"].ToString());
            if (ValidateAccess(tpath) && ValidateAccess(spath))
            {
                FileInfo sfileinfo = new FileInfo(spath);
                File.Move(spath, tpath);
                FileInfo tfileinfo = new FileInfo(tpath);
                currentContext.Response.Write(s.Serialize(new { result = true, sitem = new { Name = sfileinfo.Name, Path = currentContext.Request["spath"].ToString(), IsFile = true }, titem = new { Name = tfileinfo.Name, Path = currentContext.Request["tpath"].ToString(), IsFile = true } }));
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                currentContext.Response.StatusCode = 403;
            }
        }
        catch (Exception ex)
        {
            currentContext.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
            currentContext.Response.StatusCode = 500;
        }
    }

    /// <summary>
    /// Remove File
    /// </summary>
    private void RemoveFile()
    {
        try
        {
            string targetpath = currentContext.Server.MapPath(currentContext.Request["path"].ToString());
            if (ValidateAccess(targetpath))
            {
                File.Delete(targetpath);
                currentContext.Response.Write(s.Serialize(new { result = true }));
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                currentContext.Response.StatusCode = 403;
            }
        }
        catch (Exception ex)
        {
            currentContext.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
            currentContext.Response.StatusCode = 500;
        }
    }

    /// <summary>
    /// Create Directory
    /// </summary>
    private void CreateDirectory()
    {
        try
        {
            string targetpath = currentContext.Server.MapPath(currentContext.Request["path"].ToString());
            if (ValidateAccess(targetpath))
            {
                Directory.CreateDirectory(targetpath);
                DirectoryInfo di = new DirectoryInfo(targetpath);
                currentContext.Response.Write(s.Serialize(new
                {
                    result = true,
                    item = new
                    {
                        Path = currentContext.Request["path"].ToString(),
                        Name = di.Name,
                        CreateDate = di.CreationTime.ToString(),
                        LastAccessDate = di.LastAccessTime.ToString(),
                        LastWriteDate = di.LastWriteTime.ToString(),
                        IsFile = false
                    }
                }));
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                currentContext.Response.StatusCode = 403;
            }
        }
        catch (Exception ex)
        {
            currentContext.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
            currentContext.Response.StatusCode = 500;

        }
    }

    private void RenameDirectory()
    {
        try
        {
            string spath = currentContext.Server.MapPath(currentContext.Request["spath"].ToString());
            string tpath = currentContext.Server.MapPath(currentContext.Request["tpath"].ToString());
            if (ValidateAccess(tpath) && ValidateAccess(spath))
            {
                DirectoryInfo sdirinfo = new DirectoryInfo(spath);
                Directory.Move(spath, tpath);
                DirectoryInfo tdirinfo = new DirectoryInfo(tpath);
                currentContext.Response.Write(s.Serialize(new { result = true, sitem = new { Name = sdirinfo.Name, Path = currentContext.Request["spath"].ToString(), IsFile = false }, titem = new { Name = tdirinfo.Name, Path = currentContext.Request["tpath"].ToString(), IsFile = false } }));
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                currentContext.Response.StatusCode = 403;

            }
        }
        catch (Exception ex)
        {
            currentContext.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
            currentContext.Response.StatusCode = 500;
        }
    }

    private void RemoveDirectory()
    {
        try
        {
            string targetpath = currentContext.Server.MapPath(currentContext.Request["path"].ToString());
            if (ValidateAccess(targetpath))
            {
                Directory.Delete(targetpath);
                currentContext.Response.Write(s.Serialize(new { result = true }));
            }
            else
            {
                currentContext.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                currentContext.Response.StatusCode = 403;

            }
        }
        catch (Exception ex)
        {
            currentContext.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
            currentContext.Response.StatusCode = 500;
        }
    }

    /// <summary>
    /// Save File Data
    /// </summary>
    private void SaveFileData()
    {
        if (string.IsNullOrEmpty(currentContext.Request["path"]) || string.IsNullOrEmpty(currentContext.Request["data"]))
        {
            currentContext.Response.Write(s.Serialize(new { result = false, message = "Action Missing" }));
            currentContext.Response.StatusCode = 400;
        }
        else
        {
            try
            {
                string targetpath = currentContext.Server.MapPath(currentContext.Request["path"].ToString());
                if (ValidateAccess(targetpath))
                {
                    File.WriteAllText(targetpath, currentContext.Request["data"].ToString());
                    FileInfo info = new FileInfo(targetpath);
                    currentContext.Response.Write(s.Serialize(new
                    {
                        result = true,
                        file = new
                        {
                            IsFile = true,
                            Name = info.Name,
                            Path = currentContext.Request["path"].ToString(),
                            CreateDate = info.CreationTime.ToString(),
                            LastAccessDate = info.LastAccessTime.ToString(),
                            LastWriteDate = info.LastWriteTime.ToString()
                        }
                    }));
                }
                else
                {
                    currentContext.Response.Write(s.Serialize(new { result = false, message = "Restricted Area" }));
                    currentContext.Response.StatusCode = 403;
                }
            }
            catch (Exception ex)
            {
                currentContext.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
                currentContext.Response.StatusCode = 500;
            }
        }
    }

    /// <summary>
    /// Get file data
    /// </summary>
    private void GetFileData()
    {
        if (string.IsNullOrEmpty(currentContext.Request.QueryString["path"]))
        {
            currentContext.Response.Write(s.Serialize(new { result = false, message = "Path Missing" }));
            currentContext.Response.StatusCode = 400;
        }
        else
        {
            try
            {
                if (File.Exists(currentContext.Server.MapPath(currentContext.Request.QueryString["path"].ToString())))
                {
                    currentContext.Response.ContentType = "text/plain";
                    currentContext.Response.Write(File.ReadAllText(currentContext.Server.MapPath(currentContext.Request.QueryString["path"].ToString())));
                }
                else
                {
                    currentContext.Response.Write(s.Serialize(new { result = false, message = "File Dont Exist" }));
                    currentContext.Response.StatusCode = 400;
                }
            }
            catch (Exception ex)
            {
                currentContext.Response.Write(s.Serialize(new { result = false, message = ex.Message }));
                currentContext.Response.StatusCode = 500;
            }
        }
    }

    /// <summary>
    /// Build Directory Tree
    /// </summary>
    /// <param name="root">Root Path</param>
    /// <returns></returns>
    private DirectoryItem BuildDirectoryItemTree(DirectoryItem root)
    {
        foreach (string dirpath in Directory.GetDirectories(currentContext.Server.MapPath(root.Path)))
        {
            DirectoryInfo info = new DirectoryInfo(dirpath);

            if (info.Name.ToLower() != "bin" && info.Name.ToLower() != "studio" && !info.FullName.ToLower().EndsWith(".delete"))
            {
                DirectoryItem item = new DirectoryItem()
                {
                    IsFile = false,
                    Name = info.Name,
                    Path = string.Format("{0}\\{1}", root.Path, info.Name),
                    CreateDate = info.CreationTime.ToString(),
                    LastAccessDate = info.LastAccessTime.ToString(),
                    LastWriteDate = info.LastWriteTime.ToString()
                };
                root.Subitems.Add(item);
                BuildDirectoryItemTree(item);
            }

        }
        foreach (string filepath in Directory.GetFiles(currentContext.Server.MapPath(root.Path)))
        {
            FileInfo info = new FileInfo(filepath);
            if (!info.FullName.ToLower().EndsWith(".delete"))
            {
                DirectoryItem item = new DirectoryItem()
                {
                    IsFile = true,
                    Name = info.Name,
                    Path = string.Format("{0}\\{1}", root.Path, info.Name),
                    CreateDate = info.CreationTime.ToString(),
                    LastAccessDate = info.LastAccessTime.ToString(),
                    LastWriteDate = info.LastWriteTime.ToString()
                };
                root.Subitems.Add(item);
            }
        }

        return root;
    }

    /// <summary>
    /// Validate if user is not trying to access restricted areas
    /// </summary>
    /// <param name="targetpath"></param>
    /// <returns></returns>
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

public class DirectoryItem
{
    public string Name { get; set; }
    public bool IsFile { get; set; }
    public bool Expanded { get; set; }
    public string Path { get; set; }
    public string CreateDate { get; set; }
    public string LastAccessDate { get; set; }
    public string LastWriteDate { get; set; }
    public List<DirectoryItem> Subitems { get; set; }

    public DirectoryItem()
    {
        Subitems = new List<DirectoryItem>();
    }
}