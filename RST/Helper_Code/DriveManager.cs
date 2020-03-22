using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using RST.Models;
using System.Text;

namespace RST.Helper_Code
{
    public class DriveManager
    {
        public Member CurrentMember;
        private string drivePath = string.Empty;
        private string webPath = string.Empty;
        public bool ItemDeletable { get; set; }
        public string MemberDataAbsPath
        {
            get
            {
                return drivePath;
            }
        }

        public string MemberWebPath
        {
            get
            {
                return webPath;
            }
        }

        public DriveManager(Member m, string dataFolderAbsolutePath, string dataFolderWebPath)
        {
            CurrentMember = m;
            drivePath = dataFolderAbsolutePath;
            webPath = dataFolderWebPath;
        }

        public bool DriveExist
        {
            get
            {
                return Directory.Exists(MemberDataAbsPath);
            }
        }


        public bool RenameFile(string filepath, string name)
        {
            if (!DriveExist)
            {
                throw new DriveDoesNotExistException();
            }

            string drivepath = Path.Combine(MemberDataAbsPath, filepath);

            FileInfo fi = new FileInfo(drivepath);

            if (fi.Exists)
            {
                string newpath = Path.Combine(fi.DirectoryName, name);
                File.Move(drivepath, newpath);
                return true;
            }
            else
            {
                throw new DirectoryNotFoundException();
            }
        }

        public bool RenameFolder(string folderpath, string name)
        {
            if (!DriveExist)
            {
                throw new DriveDoesNotExistException();
            }

            string drivepath = Path.Combine(MemberDataAbsPath, folderpath);

            DirectoryInfo di = new DirectoryInfo(drivepath);

            if (di.Exists)
            {
                string newpath = Path.Combine(di.Parent.FullName, name);
                Directory.Move(drivepath, newpath);

                return true;
            }
            else
            {
                throw new DirectoryNotFoundException();
            }
        }

        public RDirectoryItem GetFolderName(string folderPath)
        {
            if (!DriveExist)
            {
                throw new DriveDoesNotExistException();
            }

            if (folderPath.Trim() != string.Empty)
            {
                string drivepath = Path.Combine(MemberDataAbsPath, folderPath);
                DirectoryInfo i = new DirectoryInfo(drivepath);
                RDirectoryItem rdi = new RDirectoryItem();
                rdi.ID = Guid.NewGuid();
                rdi.CreateDate = i.CreationTime;
                rdi.LastAccessDate = i.LastAccessTime;

                rdi.Location = i.FullName.Replace(string.Format("{0}\\", MemberDataAbsPath), string.Empty);
                rdi.ModifyDate = i.LastWriteTime;
                rdi.Name = i.Name;

                rdi.Contains = ""; // string.Format("{0} Folders, {1} Files", i.EnumerateDirectories().Count(), i.EnumerateFileSystemInfos().Count());

                rdi.ThumbNail = string.Format("{0}/bootstrap/img/drive/folder-data-icon.png", Utility.SiteURL);

                return rdi;
            }
            else
            {
                return new RDirectoryItem();
            }
        }

        public List<RFileItem> GetFileItemList(string folderpath)
        {
            if (!DriveExist)
            {
                throw new DriveDoesNotExistException();
            }

            List<RFileItem> list = new List<RFileItem>();
            string drivepath = Path.Combine(MemberDataAbsPath, folderpath);

            DirectoryInfo di = new DirectoryInfo(drivepath);
            if (di.Exists)
            {
                foreach (FileInfo i in di.EnumerateFiles())
                {
                    RFileItem rdi = new RFileItem();
                    rdi.ID = Guid.NewGuid();
                    rdi.CreateDate = i.CreationTime;
                    rdi.FileType = i.Extension;
                    rdi.LastAccessDate = i.LastAccessTime;
                    rdi.Location = i.FullName.Replace(string.Format("{0}\\", MemberDataAbsPath), string.Empty);
                    rdi.ModifyDate = i.LastWriteTime;
                    rdi.Name = i.Name;
                    rdi.Deletable = ItemDeletable;
                    rdi.Editable = true;
                    long length = i.Length;
                    if (length < 1024)
                    {
                        rdi.Size = string.Format("{0} B", i.Length.ToString());
                    }
                    else if (length >= 1024 && length < (1024 * 1024))
                    {
                        rdi.Size = string.Format("{0} KB", (i.Length / 1024).ToString());
                    }
                    else if (length >= (1024 * 1024) && length < (1024 * 1024 * 1024))
                    {
                        rdi.Size = string.Format("{0} MB", ((i.Length / 1024) / 1024).ToString());
                    }

                    rdi.WebPath = string.Format("{0}/{1}", MemberWebPath, rdi.Location.Replace("\\", "/"));
                    if (Utility.ImageFormat().ToLower().IndexOf(rdi.FileType.ToLower()) > -1)
                    {
                        rdi.ItemType = DriveItemType.ImageFile;
                        rdi.ThumbNail = rdi.WebPath;
                    }
                    else if (Utility.VideoFormat().ToLower().IndexOf(rdi.FileType.ToLower()) > -1)
                    {
                        rdi.ItemType = DriveItemType.VideoFile;
                    }
                    else if (Utility.TextFormat().ToLower().IndexOf(rdi.FileType.ToLower()) > -1)
                    {
                        rdi.ItemType = DriveItemType.TextFile;
                    }
                    else if (Utility.CompresssedFormat().ToLower().IndexOf(rdi.FileType.ToLower()) > -1)
                    {
                        rdi.ItemType = DriveItemType.ZipFile;
                    }
                    else
                    {
                        rdi.ItemType = DriveItemType.File;
                    }

                    list.Add(rdi);
                }
            }


            return list;
        }

        public List<RDirectoryItem> GetCrumbs(string p)
        {
            List<RDirectoryItem> list = new List<RDirectoryItem>();
            List<string> FolderList = p.Split("/".ToCharArray()).ToList();

            StringBuilder temp = new StringBuilder();
            foreach (string i in FolderList)
            {
                if (i != string.Empty)
                {
                    temp.Append(i);
                    temp.Append("/");

                    //< li >< a href = "viewdrive.aspx?folderpath=<%= temp %>" >
                    //<%= i %></ a > < span class="divider">/</span></li>

                    RDirectoryItem rdi = new RDirectoryItem();
                    rdi.ID = Guid.NewGuid();
                    rdi.Location = temp.ToString();
                    rdi.Name = i;
                    rdi.ThumbNail = string.Empty;
                    list.Add(rdi);
                }
            }
            return list;
        }

        public List<RDirectoryItem> GetDirectoryItemList(string folderpath)
        {
            if (!DriveExist)
            {
                throw new DriveDoesNotExistException();
            }
            bool folderDeletable = true;
            List<RDirectoryItem> list = new List<RDirectoryItem>();
            string drivepath = Path.Combine(MemberDataAbsPath, folderpath);
            folderDeletable = ItemDeletable;

            if (folderpath == string.Empty)
            {
                folderDeletable = false;
            }

            DirectoryInfo di = new DirectoryInfo(drivepath);
            if (di.Exists)
            {
                foreach (DirectoryInfo i in di.EnumerateDirectories())
                {
                    RDirectoryItem rdi = new RDirectoryItem();
                    rdi.ID = Guid.NewGuid();
                    rdi.CreateDate = i.CreationTime;
                    rdi.LastAccessDate = i.LastAccessTime;
                    rdi.Location = i.FullName.Replace(string.Format("{0}\\", MemberDataAbsPath), string.Empty);
                    rdi.ModifyDate = i.LastWriteTime;
                    rdi.Name = i.Name;
                    if (i.EnumerateDirectories().Count() == 0 && i.EnumerateFiles().Count() == 0)
                    {
                        rdi.Deletable = true;
                    }
                    else { rdi.Deletable = false; }
                    rdi.Editable = true;
                    rdi.Contains = string.Format("{0} Folders, {1} Files", i.EnumerateDirectories().Count(), i.EnumerateFiles().Count());
                    rdi.ThumbNail = string.Empty;
                    list.Add(rdi);
                }
            }
            else
            {
                throw new DriveDoesNotExistException();
            }

            return list;
        }

        public bool CreateDriveFolder(string dirPath, DriveItemType itype)
        {
            if (!DriveExist)
            {
                throw new DriveDoesNotExistException();
            }

            DirectoryInfo fi = new DirectoryInfo(string.Format("{0}\\{1}", MemberDataAbsPath, dirPath));
            fi.Create();
            return fi.Exists;
        }

        public bool DeleteFile(string folderPath)
        {
            if (!DriveExist)
            {
                throw new DriveDoesNotExistException();
            }
            string drivepath = Path.Combine(MemberDataAbsPath, folderPath);
            File.Delete(drivepath);
            return true;
        }

        public bool DeleteFolder(string folderPath)
        {
            if (!DriveExist)
            {
                throw new DriveDoesNotExistException();
            }
            string drivepath = Path.Combine(MemberDataAbsPath, folderPath);
            Directory.Delete(drivepath, true);
            return true;
        }

        public void UploadFile(string folderPath, HttpPostedFile pfile)
        {
            if (!DriveExist)
            {
                throw new DriveDoesNotExistException();
            }
            string fname = Path.GetFileName(pfile.FileName);
            string tempfilepath = Path.Combine(MemberDataAbsPath, folderPath, "temp", fname);
            string filepath = Path.Combine(MemberDataAbsPath, folderPath, fname);

            FileInfo fi = new FileInfo(filepath);

            if (!fi.Exists)
            {
                pfile.SaveAs(filepath);
            }
            else
            {
                pfile.SaveAs(tempfilepath);
            }
        }

    }
}