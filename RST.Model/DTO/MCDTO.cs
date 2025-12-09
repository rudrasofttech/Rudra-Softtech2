
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RST.Model.DTO
{
    //public class MCApiResponse<T>
    //{
    //    public int ResponseCode { get; set; }
    //    public string? Message { get; set; }
    //    public T? Data { get; set; }
    //}

    //public class AuthResponseData
    //{
    //    [JsonPropertyName("status")]
    //    public int? Status { get; set; }     // note: spelling matches JSON
    //    [JsonPropertyName("token")]
    //    public string? Token { get; set; }
    //}

    //public class SMSResponseData
    //{
    //    public string? VerficationId { get; set; }     // note: spelling matches JSON
    //    public string? MobileNumber { get; set; }
    //    public string? ResponseCode { get; set; }
    //    public string? ErrorMessage { get; set; }
    //    public string? Timeout { get; set; }
    //    public string? SMCLI { get; set; }
    //    public string? TransactionId { get; set; }
    //}

    public class TwoFactorSMSResponse
    {
        public string Status { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
    }

}
