using RST.Data;
using RST.Helper_Code;
using RST.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace RST.Controllers
{
    //[Authorize(Roles = "Admin,Demo")]
    public class DriveController : ApiController
    {
        private RSTContext db = new RSTContext();
        // GET api/<controller>
        public DriveDTO Get([FromUri]string name = "")
        {
            List<String> FolderList = new List<string>();
            RDirectoryItem CurrentFolder = new RDirectoryItem();

            string FolderPath = string.Empty;
            Member CurrentUser = db.Members.FirstOrDefault(d => d.Email == User.Identity.Name);
            DriveManager DM = new DriveManager(CurrentUser, System.Web.Hosting.HostingEnvironment.MapPath(Utility.SiteDriveFolderPath), string.Format("{0}/{1}", Utility.SiteURL, Utility.SiteDriveFolderName));
            DM.ItemDeletable = true;

            if (!string.IsNullOrEmpty(name))
            {
                FolderPath = name;
            }


            FolderList = FolderPath.Split('/').ToList<string>();
            CurrentFolder = DM.GetFolderName(FolderPath);

            DriveDTO result = new DriveDTO();
            result.Crumbs.AddRange(DM.GetCrumbs(FolderPath));
            result.Directories.AddRange(DM.GetDirectoryItemList(FolderPath));
            result.Files.AddRange(DM.GetFileItemList(FolderPath));

            return result;
        }

        //// GET api/<controller>/5
        //public string Get(int id)
        //{
        //    return "value";
        //}

        //// POST api/<controller>
        //public void Post([FromBody]string value)
        //{
        //}

        //// PUT api/<controller>/5
        //public void Put(int id, [FromBody]string value)
        //{
        //}


        // DELETE api/<controller>/5
        [Authorize(Roles = "Admin")]
        public void Delete(string name)
        {
        }
    }
}