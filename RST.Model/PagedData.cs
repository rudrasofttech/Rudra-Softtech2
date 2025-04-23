using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RST.Model
{
    public class PagedData<T>
    {
        public List<T> Items { get; set; } = [];
        public int TotalRecords { get; set; }
        public int PageSize { get; set; } = 20;
        public int PageIndex { get; set; } = 0;
        public int PageCount
        {
            get
            {
                if (PageSize > 0)
                {
                    return (int)Math.Ceiling((decimal)TotalRecords / (decimal)PageSize);
                }
                else
                {
                    return 0;
                }
            }
        }
    }
}
