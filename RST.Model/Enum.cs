namespace RST.Model
{
    public enum WebsiteType
    {
        None = 0,
        VCard = 1,
        LinkList = 2,
        Blog = 3,
        Portfolio = 4,
        ECommerce = 5,
        Educational = 6,
        NonProfit = 7,
        Resume = 8,
    }
    public enum RecordStatus
    {
        Active = 0,
        Inactive = 1,
        Deleted = 2,
        Unverified = 3
    }

    public enum PostStatus
    {
        Draft = 1,
        Publish = 2,
        Inactive = 3
    }

    public enum MemberTypeType
    {
        Admin = 1,
        Editor = 2,
        Author = 3,
        Member = 4,
        Demo = 6
    }

    public enum EmailMessageType
    {
        Activation = 1,
        Unsubscribe = 2,
        Newsletter = 3,
        ChangePassword = 4,
        Reminder = 5,
        Communication = 6
    }
}
