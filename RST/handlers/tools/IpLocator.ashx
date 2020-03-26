<%@ WebHandler Language="C#" Class="IpLocator" %>

using System;
using System.Web;
using System.Net;
using System.IO;

public class IpLocator : IHttpHandler {
    
    public void ProcessRequest (HttpContext context) {
        string apiurl = "http://api.ipinfodb.com/v3/ip-city/?key=a3f4a6e8f3c7a3854fd45dce07a2a1bcf2c84057db3e8bfc974cb683368e1f5f&ip=" + context.Request.QueryString["ip"] + "&format=json";
        WebRequest request = WebRequest.Create(apiurl);
        request.Credentials = CredentialCache.DefaultCredentials;
        WebResponse response = request.GetResponse();
        Stream dataStream = response.GetResponseStream();
        // Open the stream using a StreamReader for easy access.
        StreamReader reader = new StreamReader(dataStream);
        // Read the content.
        string responseFromServer = reader.ReadToEnd();
        context.Response.ContentType = "text/json";
        context.Response.Write(responseFromServer);
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}