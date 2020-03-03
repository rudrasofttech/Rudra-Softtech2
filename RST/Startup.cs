using System;
using System.Threading.Tasks;
using Microsoft.Owin;
using Microsoft.Owin.Security.OAuth;
using Owin;
using Microsoft.Owin.Cors;
using RST.Helper_Code.OAuth2;

[assembly: OwinStartup(typeof(RST.Startup))]

namespace RST
{
    public class Startup
    {
        /// <summary>  
        /// OAUTH options property.  
        /// </summary>  
        public static OAuthAuthorizationServerOptions OAuthOptions { get; private set; }

        /// <summary>  
        /// Public client ID property.  
        /// </summary>  
        public static string PublicClientId { get; private set; }
        public void Configuration(IAppBuilder app)
        {
            // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=316888
            app.UseCors(CorsOptions.AllowAll);
            // Configure the application for OAuth based flow  
            PublicClientId = "self";
            OAuthOptions = new OAuthAuthorizationServerOptions
            {
                TokenEndpointPath = new PathString("/Token"),
                Provider = new AppOAuthProvider(PublicClientId),
                AuthorizeEndpointPath = new PathString("/Account/ExternalLogin"),
                AccessTokenExpireTimeSpan = TimeSpan.FromHours(4),
                AllowInsecureHttp = true //Don't do this in production ONLY FOR DEVELOPING: ALLOW INSECURE HTTP!  
            };
            
            app.UseOAuthAuthorizationServer(OAuthOptions);
            app.UseOAuthBearerAuthentication(new OAuthBearerAuthenticationOptions());

            
        }
    }
}
