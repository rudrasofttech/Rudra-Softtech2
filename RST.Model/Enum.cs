namespace RST.Model
{
    public enum MemberStatus
    {
        Active = 0,
        Inactive = 1,
        Deleted = 2
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
        Reader = 5,
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
