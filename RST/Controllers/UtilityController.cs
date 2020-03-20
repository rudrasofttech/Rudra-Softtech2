using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using RST.Helper_Code;

namespace RST.Controllers
{
    public class UtilityController : ApiController
    {
        [System.Web.Http.Route("api/Utility/Slugify")]
        [System.Web.Http.HttpGet]
        public IHttpActionResult Slugify([FromUri] string t)
        {
            return Ok(Utility.Slugify(t));
        }
    }
}