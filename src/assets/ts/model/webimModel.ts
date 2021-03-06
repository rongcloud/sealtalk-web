/// <reference path="../../lib/window.d.ts"/>

module webimmodel {


    export class Conversation {
        public title: string;
        public targetId: string;
        public targetType: any;
        public lastTime: Date;
        public lastMsg: string;
        public unReadNum: number;
        public draftMsg: string;
        public firstchar: string;
        public imgSrc: string;
        public pinyin: string;
        public everychar: string;
        public mentionedInfo: RongIMLib.MentionedInfo;
        public atStr: string;
        constructor(item?: {
            title: string,
            targetId: string,
            targetType: any,
            lastTime: Date,
            lastMsg: string,
            unReadNum: number,
            draftMsg: string,
            firstchar?: string
        }) {
            if (item) {
                this.title = item.title;
                this.targetId = item.targetId;
                this.targetType = item.targetType;
                this.lastTime = item.lastTime;
                this.lastMsg = item.lastMsg;
                this.unReadNum = item.unReadNum;
                this.draftMsg = item.draftMsg;
                this.firstchar = item.firstchar;
            }
        }

        setpinying(item: {
            pinyin: string;
            everychar: string;
            firstchar: string;
        }) {
            this.pinyin = item.pinyin;
            this.everychar = item.everychar;
        }

        static convertToWebIM(item: RongIMLib.Conversation, operatorid: string) {
            var lasttime: Date;
            if (item.latestMessage && item.sentTime) {
                lasttime = new Date(item.sentTime);
            }

            var msgContent = ""
            if (item.latestMessage) {
                msgContent = Message.messageToNotification(item.latestMessage, operatorid, false)
            }

            return new Conversation({
                title: item.conversationTitle || "",
                targetId: item.targetId || "",
                targetType: item.conversationType || "",
                lastTime: lasttime || new Date(),
                lastMsg: msgContent || "",
                unReadNum: item.unreadMessageCount,
                draftMsg: item.draft || ""
            })
        }
    }

    export enum MessageDirection {
        SEND = 1,
        RECEIVE = 2,
    }

    export enum ReceivedStatus {
        READ = 0x1,
        LISTENED = 0x2,
        DOWNLOADED = 0x4
    }

    export enum SentStatus {
        /**
         * ????????????
         */
        SENDING = 10,
        /**
         * ???????????????
         */
        FAILED = 20,
        /**
         * ????????????
         */
        SENT = 30,
        /**
         * ??????????????????
         */
        RECEIVED = 40,
        /**
         * ???????????????
         */
        READ = 50,
        /**
         * ??????????????????
         */
        DESTROYED = 60,
    }

    export enum PanelType {
        Message = 1, InformationNotification = 2,
        System = 103, Time = 104, getHistory = 105, getMore = 106,
        Other = 0
    }

    export enum AtTarget {
        All = 1, Part = 2
    }

    export var MessageType = {
        DiscussionNotificationMessage: "DiscussionNotificationMessage",
        TextMessage: "TextMessage",
        ImageMessage: "ImageMessage",
        VoiceMessage: "VoiceMessage",
        RichContentMessage: "RichContentMessage",
        HandshakeMessage: "HandshakeMessage",
        HandShakeResponseMessage: "HandShakeResponseMessage",
        UnknownMessage: "UnknownMessage",
        SuspendMessage: "SuspendMessage",
        LocationMessage: "LocationMessage",
        InformationNotificationMessage: "InformationNotificationMessage",
        ContactNotificationMessage: "ContactNotificationMessage",
        ProfileNotificationMessage: "ProfileNotificationMessage",
        CommandNotificationMessage: "CommandNotificationMessage",
        ReadReceiptMessage: "ReadReceiptMessage",
        TypingStatusMessage: "TypingStatusMessage",
        FileMessage: "FileMessage",
        GroupNotificationMessage: "GroupNotificationMessage",
        RecallCommandMessage: "RecallCommandMessage",
        InviteMessage: "InviteMessage",
        HungupMessage: "HungupMessage",
        ReadReceiptRequestMessage: "ReadReceiptRequestMessage",
        ReadReceiptResponseMessage: "ReadReceiptResponseMessage",
        SyncReadStatusMessage: "SyncReadStatusMessage"
    }

    export enum conversationType {
        Private = 1, Discussion = 2, Group = 3, ChartRoom = 4, CustomerService = 5, System = 6, AppPublicService = 7, PublicService = 8
    }


    export enum NoticePanelType {
        ApplyFriend = 1, AgreedFriend = 2,
        WarningNotice = 101,
        System = 102
    }

    export enum FriendStatus {
        Requesting = 10, Requested = 11,
        Agreed = 20, Ignored = 21, Deleted = 30,
        GroupNotification = 101//???????????????
    }

    export enum CommandNotificationMessageType {
        ApplyGroup = 1, InviteAddGroup = 2, KickOutGroup = 3,
        AcceptApplyGroup = 101, RejectApplyGroup = 102, AcceptInviteAddGroup = 201, RejectInviteAddGroup = 202
    }

    export enum FileState {
        Uploading = 0, Canceled = 1, Failed = 2, Success = 3
    }

    export class ChatPanel {
        panelType: PanelType
        constructor(type: PanelType) {
            this.panelType = type;
        }
    }

    // function replacemy(ele: string) {
    //     return ele.replace(new RegExp("<[\\s\\S.]*?>", "ig"), "<amp>" + ele + "</amp>");
    //     // return '<xmp>' + e + '</xmp>';
    // }

    export class Message extends ChatPanel {
        content: any;
        conversationType: any;
        extra: string;
        objectName: string;
        messageDirection: MessageDirection;
        messageId: string;
        messageUId: string;
        receivedStatus: ReceivedStatus;
        receivedTime: Date;
        senderUserId: string;
        sentStatus: SentStatus;
        sentTime: Date;
        targetId: string;
        messageType: string;

        senderUserName: string
        senderUserImgSrc: string
        imgSrc: string
        mentionedInfo: any
        isRead: boolean
        receiptResponse: any;

        constructor(content?: any, conversationType?: string, extra?: string, objectName?: string, messageDirection?: MessageDirection, messageId?: string, receivedStatus?: ReceivedStatus, receivedTime?: number, senderUserId?: string, sentStatus?: SentStatus, sentTime?: number, targetId?: string, messageType?: string) {
            super(PanelType.Message);
        }
        static formatGIFMsg(data: any){
            if(data.objectName == 'RC:GIFMsg' && data.messageType == "UnknownMessage"){
                data.objectName = 'RC:ImgMsg';
                var unknownMsg:any = data.content;
                var _msg = unknownMsg.message;
                var _content = _msg.content;
                data.content = new RongIMLib.ImageMessage({
                    content: _content.remoteUrl,
                    imageUri: _content.remoteUrl
                });
                data.messageType = 'ImageMessage';
            }
            return data;
        }
        static convertMsg(SDKmsg: any) {

            var msg = new Message();
            msg.conversationType = SDKmsg.conversationType;
            msg.extra = SDKmsg.extra;
            msg.objectName = SDKmsg.objectName
            msg.messageDirection = SDKmsg.messageDirection;
            msg.messageId = SDKmsg.messageId;
            msg.messageUId = SDKmsg.messageUId;
            msg.receivedStatus = SDKmsg.receivedStatus;
            msg.receivedTime = new Date(SDKmsg.receivedTime);
            msg.senderUserId = SDKmsg.senderUserId;
            msg.sentStatus = SDKmsg.sendStatusMessage;
            msg.sentTime = new Date(SDKmsg.sentTime);
            msg.targetId = SDKmsg.targetId;
            msg.messageType = SDKmsg.messageType;

            switch (msg.messageType) {
                case MessageType.TextMessage:
                    var texmsg = new TextMessage();
                    var content = SDKmsg.content.content;
                    content = content.replace(/</gi, '&lt;').replace(/>/gi, '&gt;');
                    if (RongIMLib.RongIMEmoji && RongIMLib.RongIMEmoji.emojiToHTML) {
                        content = RongIMLib.RongIMEmoji.emojiToHTML(content);
                    }
                    texmsg.content = content;
                    // texmsg.content = '<xmp>' + content + '</xmp>';
                    msg.content = texmsg;
                    msg.mentionedInfo = SDKmsg.content.mentionedInfo;
                    msg.receiptResponse = SDKmsg.receiptResponse;
                    break;
                case MessageType.ImageMessage:
                    var image = new ImageMessage();
                    var content = SDKmsg.content.content || "";
                    if (typeof content == "string" && content.indexOf("base64,") == -1 && content.indexOf('http') == -1) {
                        content = "data:image/png;base64," + content;
                    }
                    image.content = content;
                    image.imageUri = SDKmsg.content.imageUri;

                    msg.content = image;
                    break;

                case MessageType.VoiceMessage:
                    var voice = new VoiceMessage();
                    voice.content = SDKmsg.content.content;
                    voice.duration = SDKmsg.content.duration;

                    msg.content = voice;
                    break;

                case MessageType.RichContentMessage:
                    var rich = new RichContentMessage();
                    rich.content = SDKmsg.content.content;
                    rich.title = SDKmsg.content.title;
                    rich.imageUri = SDKmsg.content.imageUri;
                    rich.url = SDKmsg.content.url;

                    msg.content = rich;
                    break;
                case MessageType.LocationMessage:
                    var location = new LocationMessage();
                    var content = SDKmsg.content.content || "";
                    if (typeof content == "string" && content.indexOf("base64,") == -1) {
                        content = "data:image/png;base64," + content;
                    }
                    location.content = content;
                    location.latiude = SDKmsg.content.latiude;
                    location.longitude = SDKmsg.content.longitude;
                    location.poi = SDKmsg.content.poi;

                    msg.content = location;
                    break;
                case MessageType.FileMessage:
                    var file = new FileMessage();
                    var content = SDKmsg.content.content || "";
                    file.name = SDKmsg.content.name;
                    file.size = SDKmsg.content.size;
                    file.type = SDKmsg.content.type;
                    file.fileUrl = SDKmsg.content.fileUrl;
                    file.extra = SDKmsg.content.extra;
                    file.state = FileState.Success;
                    msg.content = file;
                    break;
                case MessageType.InformationNotificationMessage:
                    // var info = new InformationNotificationMessage();
                    // info.content = SDKmsg.content.message;
                    // msg.content = info;
                    msg.content = SDKmsg.content.message;
                    msg.panelType = webimmodel.PanelType.InformationNotification;
                    break;
                case MessageType.ContactNotificationMessage:
                    var contact = new ContactNotificationMessage();
                    contact.content = SDKmsg.content.message;
                    contact.operation = SDKmsg.content.operation;
                    contact.sourceUserId = SDKmsg.content.sourceUserId;
                    contact.targetUserId = SDKmsg.content.targetUserId;
                    contact.message = SDKmsg.content.content;

                    switch (contact.operation) {
                        case "Request":
                            contact.noticeType = NoticePanelType.ApplyFriend;
                            break;
                        case "AcceptResponse":
                            contact.noticeType = NoticePanelType.AgreedFriend;
                            contact.content = "??????????????????"
                            break;
                        case "RejectResponse":
                            // tmp.noticeType = NoticePanelType.WarningNotice;
                            // tmp.content = "??????????????????"
                            console.log("?????????????????????????????????");
                            break;
                    }
                    msg.content = contact;
                    break;
                case MessageType.CommandNotificationMessage:
                    var comm = new CommandNotificationMessage();
                    comm.noticeType = NoticePanelType.WarningNotice;
                    comm.data = SDKmsg.content.data;
                    comm.name = SDKmsg.content.name;
                    msg.content = comm;
                    break;
                case MessageType.DiscussionNotificationMessage:
                    // var discussion = new DiscussionNotificationMessage();
                    // discussion.extension = SDKmsg.content.extension;
                    // discussion.operation = SDKmsg.content.operation;
                    // discussion.type = SDKmsg.content.type;
                    // discussion.isHasReceived = SDKmsg.content.isHasReceived;
                    // msg.content = discussion;
                    // msg.panelType = webimmodel.PanelType.InformationNotification;
                    if (SDKmsg.objectName == "RC:DizNtf") {
                        var groupnot = new webimmodel.InformationNotificationMessage();
                        groupnot.content = SDKmsg.content.message;
                        msg.content = groupnot;
                        msg.panelType = webimmodel.PanelType.InformationNotification;
                    } else {
                        console.log("has unknown message type " + SDKmsg.messageType)
                    }
                    break;
                case MessageType.ReadReceiptMessage:
                case MessageType.TypingStatusMessage:
                    break;
                case MessageType.RecallCommandMessage:
                    msg.content = '?????????????????????';
                    msg.panelType = webimmodel.PanelType.InformationNotification;
                    break;
                case MessageType.InviteMessage:
                case MessageType.HungupMessage:
                    // if(SDKmsg.content.mediaType == '1'){
                    //   msg.content = '????????????';
                    // }
                    // else if(SDKmsg.content.mediaType == '2'){
                    //   msg.content = '????????????';
                    // }
                    msg.content = '???????????????????????????????????????';
                    msg.panelType = webimmodel.PanelType.InformationNotification;
                    break;
                case MessageType.ReadReceiptRequestMessage:
                    msg.content = SDKmsg.content.messageUId;
                    break;
                case MessageType.ReadReceiptResponseMessage:
                    msg.content = SDKmsg.content.receiptMessageDic;
                    msg.receiptResponse = SDKmsg.receiptResponse;
                    break;
                case MessageType.SyncReadStatusMessage:
                    break;
                default:
                    if (SDKmsg.objectName == "ST:GrpNtf") {
                        var groupnot = new webimmodel.InformationNotificationMessage();
                        groupnot.content = SDKmsg.content.message;
                        msg.content = groupnot;
                        msg.panelType = webimmodel.PanelType.InformationNotification;
                    } else if(SDKmsg.objectName == "RC:RLStart" || SDKmsg.objectName == "RC:RL" || SDKmsg.objectName == "RC:RcCmd"){

                    }
                    else
                    {
                       msg.content = '???????????????????????????????????????';
                       msg.panelType = webimmodel.PanelType.InformationNotification;
                       console.log("has unknown message type " + SDKmsg.messageType)
                    }
                    break;
            }
            if (msg.content) {
                msg.content.userInfo = SDKmsg.content.userInfo;
            }

            return msg;
        }

        static messageToNotification = function(msg: any, operatorid: string, isnotification: boolean) {
            if (!msg)
                return null;
            var msgtype = msg.messageType, msgContent: string;
            if (msgtype == MessageType.ImageMessage || msg.objectName == 'RC:GIFMsg') {
                msgContent = "[??????]";
            } else if (msgtype == MessageType.LocationMessage) {
                msgContent = "[??????]";
            } else if (msgtype == MessageType.RichContentMessage) {
                msgContent = "[??????]";
            } else if (msgtype == MessageType.VoiceMessage) {
                msgContent = "[??????]";
            }else if (msgtype == webimmodel.MessageType.FileMessage) {
                msgContent = "[??????] " + msg.content.name;
            } else if (msgtype == MessageType.ContactNotificationMessage || msgtype == MessageType.CommandNotificationMessage || msgtype == MessageType.InformationNotificationMessage) {
                msgContent = "[????????????]";
            } else if (msg.objectName == "ST:GrpNtf") {
              // var data = msg.content.message.content.data.data;
              var data = msg.content.data;
              // switch (msg.content.message.content.operation) {
               switch (msg.content.operation) {
                    case "Add":
                        if(msg.content.operatorUserId == operatorid){
                          msgContent = data.targetUserDisplayNames ? ("?????????" + data.targetUserDisplayNames.join("???") + "???????????????") : "????????????";
                        }else{
                          msgContent = data.targetUserDisplayNames ? (data.operatorNickname + "??????" + data.targetUserDisplayNames.join("???") + "???????????????") : "????????????";
                        }
                        break;
                    case "Quit":
                        msgContent = data.operatorNickname + "???????????????";
                        break;
                    case "Kicked":
                        //????????????????????????
                        if(msg.content.operatorUserId == operatorid){
                           msgContent = data.targetUserDisplayNames ? ("??????" + data.targetUserDisplayNames.join("???") + "???????????????") : "????????????";
                        }else{
                          msgContent = data.targetUserDisplayNames ? (data.operatorNickname + "???" + data.targetUserDisplayNames.join("???") + "???????????????") : "????????????";
                        }
                        break;
                    case "Rename":
                        if(msg.content.operatorUserId == operatorid){
                          msgContent = "?????????????????????" + data.targetGroupName;
                        }else{
                          msgContent = data.operatorNickname + "??????????????????" + data.targetGroupName;
                        }
                        break;
                    case "Create":
                        if(msg.content.operatorUserId == operatorid){
                          msgContent = "??????????????????";
                        }else{
                          msgContent = data.operatorNickname + "???????????????";
                        }
                        break;
                    case "Dismiss":
                        msgContent = data.operatorNickname + "???????????????";
                        if(data.targetGroupName){
                            msgContent += data.targetGroupName;
                        }
                        break;
                    default:
                        break;
                }
            } else if (msg.objectName == "RC:DizNtf") {
                var data = msg
                // var members = msg.content.extension.split(',');
                // for (var i = 0, len = members.length; i < len; i++) {
                //     mainServer.user.getInfo(members[i]).success(function (rep) {
                //         if (item.content === comment) {
                //             item.content = rep.result.nickname + item.content;
                //         }
                //         else {
                //             item.content = rep.result.nickname + "???" + item.content;
                //         }
                //     });
                // }
                switch (msg.content.type) {
                    case 1:
                        msgContent = " ??????????????????";
                        break;
                    case 2:
                        msgContent =  " ??????????????????";
                        break;
                    case 4:
                        //????????????????????????
                        msgContent = " ??????????????????";
                        break;
                    case 3:
                        msgContent = " ????????????????????????";
                        break;
                    default:
                        break;
                }
            }
            else if(msgtype == webimmodel.MessageType.TextMessage){
                msgContent = msg.content ? msg.content.content : "";

                msgContent = webimutil.Helper.escapeSymbol.escapeHtml(msgContent);
                if(isnotification){
                   msgContent = RongIMLib.RongIMEmoji.emojiToSymbol(msgContent);
                   if (webimutil.Helper.os.mac){
                     msgContent = RongIMLib.RongIMEmoji.symbolToEmoji(msgContent);
                   }
                }
                else{
                    if (RongIMLib.RongIMEmoji && RongIMLib.RongIMEmoji.emojiToHTML) {
                        msgContent = RongIMLib.RongIMEmoji.emojiToHTML(msgContent);
                    }
                }

                // if (!webimutil.Helper.browser.chrome) {
                msgContent = msgContent.replace(/\n/g, " ");
                msgContent = msgContent.replace(/([\w]{49,50})/g, "$1 ");
                // msgContent = msgContent.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
                // }

            }
            else if(msgtype == webimmodel.MessageType.RecallCommandMessage){
               msgContent = "??????????????????";
            }
            // else if(msgtype == webimmodel.MessageType.SyncReadStatusMessage){
            // }
            // else if(msgtype == webimmodel.MessageType.ReadReceiptRequestMessage){
            //
            // }
            // else if(msgtype == webimmodel.MessageType.ReadReceiptResponseMessage){
            //
            // }
            else {
                msgContent = "[???????????????????????????????????????]";
            }
            return msgContent;
        }

    }


    export class ContactNotificationMessage extends Message {
        operation: string;
        sourceUserId: string;
        targetUserId: string;
        message: string;
        noticeType: number;
    }

    export class CommandNotificationMessage extends Message {
        name: string;
        data: any;
        noticeType: number;
    }


    export class TextMessage {
        userInfo: UserInfo;
        content: string;
        constructor(msg?: any) {
            msg = msg || {};
            this.content = msg.content;
            this.userInfo = msg.userInfo;
        }
    }
    export class InformationNotificationMessage {
        userInfo: UserInfo;
        content: string;
        extra: string;
        messageName: string;
    }

    export class ImageMessage {
        userInfo: UserInfo;
        content: string;
        imageUri: string;
    }

    export class VoiceMessage {
        userInfo: UserInfo;
        content: string;
        duration: string;
    }

    export class LocationMessage {
        userInfo: UserInfo;
        content: string;
        latiude: number;
        longitude: number;
        poi: string;
    }

    export class RichContentMessage {
        userInfo: UserInfo;
        content: string;
        title: string;
        imageUri: string;
        url: string;
    }

    export class DiscussionNotificationMessage {
        userInfo: UserInfo;
        extension: string;
        type: number;
        isHasReceived: boolean;
        operation: string;
        extra: string;
        messageName: string;
    }

    export class FileMessage {
        userInfo: UserInfo;
        // content: string;
        // title: string;
        name: string;
        size: number;
        type: number;
        fileUrl: string;
        extra: string;
        state: FileState;
        progress: number;  // 0-100
    }

    export class ReadReceiptRequestMessage {
        messageUId: string;
    }

    export class ReadReceiptResponseMessage {
        receiptMessageDic: any;
    }

    export class GetHistoryPanel extends ChatPanel {
        constructor() {
            super(PanelType.getHistory)
        }
    }

    export class GetMoreMessagePanel extends ChatPanel {
        constructor() {
            super(PanelType.getMore)
        }
    }

    export class TimePanl extends ChatPanel {
        sendTime: Date
        constructor(time: Date) {
            super(PanelType.Time)
            this.sendTime = time;
        }
    }

    export class WarningNoticeMessage {
        status: number;
        content: string;
        timestamp: number;//????????????????????????
        constructor(content: string) {
            this.content = content;
            this.status = webimmodel.FriendStatus.GroupNotification
        }
    }


    export class NotificationFriend {
        id: string
        name: string
        portraitUri: string
        content: string
        status: string
        timestamp: number//????????????????????????
        firstchar: string

        constructor(item: {
            id: string,
            name: string,
            portraitUri: string,
            content: string,
            status: string
            timestamp: number
        }) {
            this.id = item.id;
            this.name = item.name;
            this.portraitUri = item.portraitUri;
            this.content = item.content;
            this.status = item.status;
            this.timestamp = item.timestamp;
        }

    }


    export class UserInfo {
        constructor(public id?: string,
            public token?: string,
            public nickName?: string,
            public portraitUri?: string,
            public phone?: string,
            public region?: string,
            public firstchar?: string) { }
    }

    export class Contact {
        id: string;
        name: string;
        imgSrc: string;
        pinyin: string;
        everychar: string;
        firstchar: string;
        displayName: string;

        constructor(item?: {
            id: string;
            name: string;
            imgSrc: string;
        }) {
            this.id = item.id;
            this.name = item.name;
            this.imgSrc = item.imgSrc;
        }

        setpinying(item: {
            pinyin: string;
            everychar: string;
            firstchar: string;
        }) {
            this.pinyin = item.pinyin;
            this.everychar = item.everychar;
            this.firstchar = item.firstchar;
        }
    }
    export class Friend extends Contact {
        displayName: string
        mobile: string
        constructor(item: {
            id: string;
            name: string;
            imgSrc: string;
        }) {
            super(item);
        }
    }

    export class Subgroup {
        title: string
        list: Friend[]
        constructor(title: string, list: Friend[]) {
            this.title = title;
            this.list = list;
        }
    }

    export class Group extends Contact {
        upperlimit: number;
        fact: number;
        creater: string;
        memberList: Member[];

        constructor(item: {
            id: string;
            name: string;
            imgSrc: string;
            upperlimit: number;
            fact: number;
            creater: string;
        }) {
            super(item);
            this.upperlimit = item.upperlimit;
            this.fact = item.fact;
            this.creater = item.creater;
            this.memberList = []
        }

    }

    export class Discussion extends Contact {
        upperlimit: number;
        fact: number;
        creater: string;
        memberList: Member[];

        constructor(item: {
            id: string;
            name: string;
            imgSrc: string;
            upperlimit: number;
            fact: number;
            creater: string;
            isOpen: boolean;
        }) {
            super(item);
            this.upperlimit = item.upperlimit;
            this.fact = item.fact;
            this.creater = item.creater;
            this.memberList = []
        }

    }

    export class Member extends Contact {
        id: string;
        name: string;
        imgSrc: string;
        role: string;
        displayName: string;
        // pinyin: string;
        // first: string;
        constructor(item: {
            id: string;
            name: string;
            imgSrc: string;
            role?: string;
            displayName?: string;
        }) {
            super(item);
            this.role = item.role;
        }
    }

}
