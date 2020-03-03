using RST.Data;
using RST.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Xml.Serialization;

namespace RST.Helper_Code
{
    public class Utility
    {
        #region WebsiteSetting
        public static string SiteLogo
        {
            get
            {
                return GetSiteSetting("SiteLogo");
            }
        }

        public static string ContactEmail
        {
            get
            {
                return GetSiteSetting("ContactEmail");
            }
        }

        public static string Fax
        {
            get
            {
                return GetSiteSetting("Fax");
            }
        }

        public static string Phone
        {
            get
            {
                return GetSiteSetting("Phone");
            }
        }

        public static string Address
        {
            get
            {
                return GetSiteSetting("Address");
            }
        }

        public static string SiteName
        {
            get
            {
                return GetSiteSetting("SiteName");
            }
        }

        public static string SiteURL
        {
            get
            {
                return GetSiteSetting("SiteURL");
            }
        }

        public static string UniversalPassword
        {
            get
            {
                return GetSiteSetting("UniversalPassword");
            }
        }

        public static string NewsletterEmail
        {
            get
            {
                return GetSiteSetting("NewsletterEmail");
            }
        }

        public static string AdminName
        {
            get
            {
                return GetSiteSetting("AdminName");
            }
        }

        public static string SiteTitle
        {
            get
            {
                return GetSiteSetting("SiteTitle");
            }
        }

        public static string NewsletterDesign()
        {
            return GetSiteSetting("NewsletterDesign");
        }

        public static string ImageFormat()
        {
            return ".bmp,.dds,.dng,.gif,.jpg,.png,.psd,.psd,.pspimage,.tga,.thm,.tif,.yuv,.ai,.eps,.ps,.svg";
        }

        public static string VideoFormat()
        {
            return ".3g2,.3gp,.asf,.asx,.flv,.mov,.mp4,.mpg,.rm,.srt,.swf,.vob,.wmv";
        }

        public static string TextFormat()
        {
            return ".doc,.docx,.log,.msg,.odt,.pages,.rtf,.tex,.txt,.wpd,.wps";
        }

        public static string CompresssedFormat()
        {
            return ".7z,.cbr,.deb,.gz,.pkg,.rar,.rpm,.sit,.sitx,.tar.gz,.zip,.zipx";
        }
        #endregion

        #region Important Folder Paths
        public static string ArticleFolder
        {
            get
            {
                return "~/sitedata/Article";
            }
        }

        public static string CustomPageFolder
        {
            get
            {
                return "~/sitedata/CustomPage";
            }
        }

        public static string SiteDriveFolderPath
        {
            get
            {
                return string.Format("~/{0}", SiteDriveFolderName);
            }
        }

        public static string SiteDriveFolderName
        {
            get
            {
                return "drive";
            }
        }
        #endregion

        #region Serialization helper functions
        public static T Deserialize<T>(string obj)
        {
            // Create a new file stream for reading the XML file
            XmlSerializer SerializerObj = new XmlSerializer(typeof(T));
            // Load the object saved above by using the Deserialize function
            T LoadedObj = (T)SerializerObj.Deserialize(new StringReader(obj));

            return LoadedObj;
        }

        public static string Serialize<T>(T obj)
        {
            // Create a new XmlSerializer instance with the type of the test class
            XmlSerializer SerializerObj = new XmlSerializer(typeof(T));

            // Create a new file stream to write the serialized object to a file
            TextWriter WriteFileStream = new StringWriter();
            SerializerObj.Serialize(WriteFileStream, obj);

            // Cleanup
            return WriteFileStream.ToString();
        }
        #endregion

        #region General Report Functions
        public static int GetArticleCount()
        {
            RSTContext rc = new RSTContext();
            return rc.Posts.Count(t => t.Status != PostStatus.Inactive);
        }

        public static int GetCustomPageCount()
        {
            RSTContext rc = new RSTContext();
            return rc.CustomPages.Count(t => t.Status != PostStatus.Inactive);
        }

        public static int GetMemberCount()
        {
            RSTContext rc = new RSTContext();
            return rc.Members.Count(t => t.Status != MemberStatus.Inactive);
        }
        #endregion

        #region Lookup data functions
        public static List<Category> CategoryList()
        {
            RSTContext rc = new RSTContext();
            return rc.Categories.ToList();
        }

        public static string GetSiteSetting(string keyname)
        {
            RSTContext rc = new RSTContext();
            return rc.WebsiteSettings.First(t => t.KeyName == keyname).KeyValue;
        }
        #endregion

        #region URL purifier functions
        public static string RemoveAccent(string txt)
        {
            byte[] bytes = System.Text.Encoding.GetEncoding("Cyrillic").GetBytes(txt);
            return System.Text.Encoding.ASCII.GetString(bytes);
        }

        public static string Slugify(string phrase)
        {
            string str = RemoveAccent(phrase).ToLower();
            str = System.Text.RegularExpressions.Regex.Replace(str, @"[^a-z0-9/\s-]", ""); // Remove all non valid chars          
            str = System.Text.RegularExpressions.Regex.Replace(str, @"\s+", " ").Trim(); // convert multiple spaces into one space  
            str = System.Text.RegularExpressions.Regex.Replace(str, @"\s", "-"); // //Replace spaces by dashes
            return str;
        }
        #endregion

        #region Blog Function
        /// <summary>
        /// Generate a blog article url. Generated URL will be ~/blog/{title}/{id}
        /// </summary>
        /// <param name="a">Article</param>
        /// <returns></returns>
        public static string GenerateBlogArticleURL(Post a, string root)
        {
            return string.Format("{1}/blog/{0}", a.URL, root);
        }
        #endregion

        #region Validation Functions
        public static bool ValidateEmail(string email)
        {
            string pattern = @"\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*";
            Regex regex = new Regex(pattern, RegexOptions.IgnoreCase);
            return regex.IsMatch(email);
        }

        public static bool ValidateRequired(string input)
        {
            if (input.Trim() == string.Empty)
            {
                return false;
            }
            else { return true; }
        }
        #endregion
    }
}