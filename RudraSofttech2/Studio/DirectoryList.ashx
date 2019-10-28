<%@ WebHandler Language="C#" Class="DirectoryList" %>

using System;
using System.Web;
using System.Web.Script.Serialization;
using System.IO;
using System.Collections.Generic;

public class DirectoryList : IHttpHandler
{
    HttpContext currentContext;

    public void ProcessRequest(HttpContext context)
    {
        currentContext = context;
        JavaScriptSerializer s = new JavaScriptSerializer();
        context.Response.ContentType = "text/json";
        DirectoryItem di = new DirectoryItem();
        di.Name = "";
        di.IsFile = false;
        di.Path = "~";
        di = BuildDirectoryItemTree(di);
        context.Response.Write(s.Serialize(di));
    }

    private DirectoryItem BuildDirectoryItemTree(DirectoryItem root)
    {
        foreach (string dirpath in Directory.GetDirectories(currentContext.Server.MapPath(root.Path)))
        {
            DirectoryInfo info = new DirectoryInfo(dirpath);

            if (info.Name.ToLower() != "bin" && info.Name.ToLower() != "studio" && !info.FullName.ToLower().EndsWith(".delete"))
            {
                DirectoryItem item = new DirectoryItem() { IsFile = false, Name = info.Name, Path = string.Format("{0}\\{1}", root.Path, info.Name),
                    CreateDate = info.CreationTime.ToString(), LastAccessDate = info.LastAccessTime.ToString(), LastWriteDate = info.LastWriteTime.ToString()  };
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