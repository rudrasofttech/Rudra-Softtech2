export class API {
    static GetURL() {
        if (window.location.hostname.toLowerCase().startsWith("localhost"))
            return  "https://www.rudrasofttech.com/api";
        else if (window.location.hostname.toLowerCase().startsWith("www.rudrasofttech.com") || window.location.hostname.toLowerCase().startsWith("rudrasofttech.com"))
            return "https://www.rudrasofttech.com/api";
        else
            return "";
    }
}