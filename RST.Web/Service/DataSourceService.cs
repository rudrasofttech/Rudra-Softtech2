using Microsoft.Data.SqlClient;
using RST.Model;
using System.Text;
using System.Xml.Xsl;
using System.Xml;
using RST.Context;
using Microsoft.EntityFrameworkCore;

namespace RST.Web.Service
{
    
    public class DataSourceService(RSTContext ctx)
    {
        private readonly RSTContext db = ctx;

        public string LoadContent(string name)
        {

            CustomDataSource cds = GetByName(name);
            if (cds != null)
            {
                if (string.IsNullOrEmpty(cds.Query))
                {
                    return cds.HtmlTemplate;
                }
                else
                {
                    using var conn = new SqlConnection(db.Database.GetConnectionString());
                    conn.Open();
                    var comm = new SqlCommand(string.Format("{0} FOR XML RAW , ROOT('DataSource'), Elements;", cds.Query), conn);
                    var reader = comm.ExecuteXmlReader();
                    if (reader.Read())
                    {
                        string data = string.Format("<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\" xmlns:msxsl=\"urn:schemas-microsoft-com:xslt\" exclude-result-prefixes=\"msxsl\"> <xsl:output method=\"xml\" omit-xml-declaration=\"yes\" /> {0} </xsl:stylesheet>", cds.HtmlTemplate.Trim());
                        // Load the style sheet.
                        var xslt = new XslCompiledTransform();
                        var xmlread = XmlReader.Create(new StringReader(data));
                        xslt.Load(xmlread);

                        // Execute the transform and output the results to a file.
                        var builder = new StringBuilder();
                        var xmlOutput = XmlWriter.Create(builder);

                        xslt.Transform(reader, xmlOutput);

                        return builder.ToString();
                    }
                }

            }


            return string.Empty;
        }

        public string ParseAndPopulate(string input)
        {
            if (string.IsNullOrEmpty(input))
            {
                return input;
            }
            string output = input;

            var doc = new HtmlAgilityPack.HtmlDocument();
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
            var cds = db.CustomDataSources.FirstOrDefault(t => t.ID == id);
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
            return db.CustomDataSources.First(t => t.ID == id);
        }

        public CustomDataSource GetByName(string name)
        {
            return db.CustomDataSources.First(t => t.Name == name);
        }
    }
}
