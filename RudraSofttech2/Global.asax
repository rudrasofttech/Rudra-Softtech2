<%@ Application Language="C#" %>
<%@ Import Namespace="System.Web.Routing" %>

<script runat="server">

    void Application_Start(object sender, EventArgs e)
    {
        // Code that runs on application startup
        RegisterRoutes(RouteTable.Routes);
    }

    public static void RegisterRoutes(RouteCollection routes)
    {
        routes.Ignore("{resource}.axd/{*pathInfo}");
        routes.Ignore("{resource}.ashx/{*pathInfo}");
        routes.Ignore("{pages}.aspx/{*pathInfo}");

    //    //Direct URL
    //    routes.MapPageRoute("LogoutPage", "logout", "~/logout.aspx");
    //    routes.MapPageRoute("Sitemap", "sitemap", "~/sitemap.aspx");

    //    //RudraSofttech Content Related URL
    //    routes.MapPageRoute("BlogListPage", "blog/", "~/list.aspx");
    //    routes.MapPageRoute("BlogCategoryListPage", "blog/{category}/index", "~/list.aspx");
    //    routes.MapPageRoute("BlogYearListPage", "blog/{year}", "~/list.aspx", false,
    //        new RouteValueDictionary { { "year", DateTime.Now.Year.ToString() } },
    //        new RouteValueDictionary { { "year", @"\d{4}" } });
    //    routes.MapPageRoute("BlogMonthListPage", "blog/{year}/{month}", "~/list.aspx");
    //    routes.MapPageRoute("BlogDayListPage", "blog/{year}/{month}/{day}", "~/list.aspx");
    //    //anyother blog url pattern should be given to article page
    //    routes.MapPageRoute("BlogArticleRoute", "blog/{*pagename}", "~/article.aspx");

    //    //Account Related URL
    //    routes.MapPageRoute("LoginPage", "account/login", "~/account/login.aspx");
    //    routes.MapPageRoute("MyAccount", "account/myaccount", "~/account/myaccount.aspx");
    //    routes.MapPageRoute("register", "account/register", "~/account/register.aspx");
    //    routes.MapPageRoute("forgotpassword", "account/forgotpassword", "~/account/forgotpassword.aspx");
    //    routes.MapPageRoute("changepassword", "account/changepassword", "~/account/changepassword.aspx");
    //    routes.MapPageRoute("subscribe", "account/subscribe", "~/account/subscribe.aspx");
    //    routes.MapPageRoute("activate", "account/activate", "~/account/activate.aspx");
    //    routes.MapPageRoute("unsubscribe", "account/unsubscribe", "~/account/unsubscribe.aspx");
    //    routes.MapPageRoute("viewemail", "account/email/{id}", "~/account/email.aspx");


    //    //Any Damn Thing Catch Here
        routes.MapPageRoute("DefaultPageRoute", string.Empty, "~/default.aspx");
    //    routes.MapPageRoute("CustomPageRoute", "{*pagename}", "~/custompage.aspx");
    }

    void Application_End(object sender, EventArgs e)
    {
        //  Code that runs on application shutdown

    }

    void Application_Error(object sender, EventArgs e)
    {
        // Code that runs when an unhandled error occurs

    }

    void Session_Start(object sender, EventArgs e)
    {
        // Code that runs when a new session is started

    }

    void Session_End(object sender, EventArgs e)
    {
        // Code that runs when a session ends. 
        // Note: The Session_End event is raised only when the sessionstate mode
        // is set to InProc in the Web.config file. If session mode is set to StateServer 
        // or SQLServer, the event is not raised.

    }

</script>
