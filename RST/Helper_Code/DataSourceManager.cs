using RST.Data;
using RST.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Xml;
using System.Xml.Xsl;

namespace RST.Helper_Code
{
    public class DataSourceManager
    {
        RSTContext db;
        public DataSourceManager(RSTContext context)
        {
            db = context;
        }

        public string LoadContent(string name)
        {

            CustomDataSource cds = GetByName(name);
            if (cds != null)
            {
                if (cds.Query.Trim() == string.Empty)
                {
                    return cds.HtmlTemplate;
                }
                else
                {
                    using (SqlConnection conn = new SqlConnection(ConfigurationManager.ConnectionStrings["RSTContext"].ConnectionString))
                    {
                        conn.Open();
                        SqlCommand comm = new SqlCommand(string.Format("{0} FOR XML RAW , ROOT('DataSource'), Elements;", cds.Query), conn);
                        XmlReader reader = comm.ExecuteXmlReader();
                        if (reader.Read())
                        {
                            string data = string.Format("<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\" xmlns:msxsl=\"urn:schemas-microsoft-com:xslt\" exclude-result-prefixes=\"msxsl\"> <xsl:output method=\"xml\" omit-xml-declaration=\"yes\" /> {0} </xsl:stylesheet>", cds.HtmlTemplate.Trim());
                            // Load the style sheet.
                            XslCompiledTransform xslt = new XslCompiledTransform();
                            XmlReader xmlread = XmlReader.Create(new StringReader(data));
                            xslt.Load(xmlread);

                            // Execute the transform and output the results to a file.
                            StringBuilder builder = new StringBuilder();
                            XmlWriter xmlOutput = XmlWriter.Create(builder);

                            xslt.Transform(reader, xmlOutput);

                            return builder.ToString();
                        }
                    }
                }
                
            }


            return string.Empty;
        }

        public string ParseAndPopulate(string input)
        {
            string output = input;

            HtmlAgilityPack.HtmlDocument doc = new HtmlAgilityPack.HtmlDocument();
            doc.LoadHtml(input);
            if (doc.DocumentNode.SelectNodes("//datasource") != null)
            {
                foreach (HtmlAgilityPack.HtmlNode ds in doc.DocumentNode.SelectNodes("//datasource"))
                {
                    HtmlAgilityPack.HtmlAttribute att = ds.Attributes["name"];
                    if (att != null)
                    {
                        try
                        {
                            var temp = doc.CreateElement("temp");
                            temp.InnerHtml = LoadContent(att.Value);
                            var current = ds;
                            foreach (var child in temp.ChildNodes)
                            {
                                ds.ParentNode.InsertAfter(child, current);
                                current = child;
                            }
                            ds.Remove();
                        }
                        catch { }
                    }
                }
            }
            output = doc.DocumentNode.OuterHtml;
            return output;
        }


        //public bool Add(string name, string query, string template, long memberid)
        //{
        //    using (RudraSofttechDataClassesDataContext dc = new RudraSofttechDataClassesDataContext())
        //    {
        //        CustomDataSource item = new CustomDataSource();
        //        item.Name = name;
        //        item.Query = query;
        //        item.HtmlTemplate = template;
        //        item.DateCreated = DateTime.Now;
        //        item.CreatedBy = memberid;
        //        dc.CustomDataSources.InsertOnSubmit(item);
        //        dc.SubmitChanges();
        //        return true;
        //    }
        //}

        //public bool Update(int id, string name, string query, string template, long memberid)
        //{
        //    using (RudraSofttechDataClassesDataContext dc = new RudraSofttechDataClassesDataContext())
        //    {
        //        CustomDataSource item = (from t in dc.CustomDataSources where t.ID == id select t).SingleOrDefault<CustomDataSource>();
        //        item.Name = name;
        //        item.Query = query;
        //        item.HtmlTemplate = template;
        //        item.ModifiedBy = memberid;
        //        item.DateModified = DateTime.Now;
        //        dc.SubmitChanges();
        //        return true;
        //    }
        //}

        public bool Delete(int id)
        {
            CustomDataSource cds = db.CustomDataSources.FirstOrDefault(t => t.ID == id);
            if (cds != null)
            {
                db.CustomDataSources.Remove(cds);
                db.SaveChanges();
                return true;
            }
            else
            {
                return false;
            }
        }

        public CustomDataSource GetById(int id)
        {
            return db.CustomDataSources.FirstOrDefault(t => t.ID == id);
        }

        public CustomDataSource GetByName(string name)
        {
            return db.CustomDataSources.FirstOrDefault(t => t.Name == name);           
        }
    }
}