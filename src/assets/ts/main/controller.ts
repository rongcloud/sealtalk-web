/// <reference path="../../../../typings/angularjs/angular.d.ts"/>
/// <reference path="server.ts"/>
/// <reference path="../model/webimModel.ts"/>


var mainCtr = angular.module("webim.main.controller", ["webim.main.server", "webim.conversation.server"]);
var IMGDOMAIN = "http://7xogjk.com1.z0.glb.clouddn.com/";
var FILEDOMAIN = "http://o83059m7d.bkt.clouddn.com/";

mainCtr.controller("mainController", ["$scope", "$state", "$window", "$timeout", "$http",
    "mainDataServer", "conversationServer", "mainServer", "RongIMSDKServer", "appconfig",
    function($scope: any, $state: angular.ui.IStateService, $window: angular.IWindowService, $timeout: angular.ITimeoutService,
        $http: angular.IHttpService,
        mainDataServer: mainDataServer, conversationServer: conversationServer, mainServer: mainServer, RongIMSDKServer: RongIMSDKServer, appconfig: any) {
        var isConnecting = false
        if (!mainDataServer.loginUser.id) {
            var userid = webimutil.CookieHelper.getCookie("loginuserid"),usertoken = webimutil.CookieHelper.getCookie("loginusertoken");
            if (userid) {
                mainDataServer.loginUser.id = userid;
                mainDataServer.loginUser.token = usertoken;
            } else {
                // $state.go("account.signin");
                mainServer.user.logout().success(function () {
                    webimutil.CookieHelper.removeCookie("loginuserid");
                    mainDataServer.loginUser = new webimmodel.UserInfo();
                    conversationServer.historyMessagesCache.length = 0;
                    if (window.Electron) {
                        window.Electron.webQuit();
                    }
                    $state.go("account.signin");
                });
                return;
            }
        }

        mainServer.user.getInfo(mainDataServer.loginUser.id).success(function(rep) {
            if (rep.code == 200) {
                mainDataServer.loginUser.nickName = rep.result.nickname
                mainDataServer.loginUser.firstchar = webimutil.ChineseCharacter.getPortraitChar(rep.result.nickname);
                mainDataServer.loginUser.portraitUri = rep.result.portraitUri
                angular.element(document.getElementById("loginuser")).css("background-color", webimutil.Helper.portraitColors[mainDataServer.loginUser.id.charCodeAt(0) % webimutil.Helper.portraitColors.length]);
            } else {
                console.log("get user info error")
            }
        }).error(function() {

        })

        $scope.mainData = <mainDataServer>mainDataServer;
        $scope.$on('refreshSelectCon', function(event: any, data: string) {
          $scope.unSelect(data);
        });
        //???????????????????????????
        $scope.showState = {
            isPhone: false,
            isChat: false
        }
        $scope.switchbtn = {
            isFriendList: false,
            issearchList: false
        }
        $scope.curCon = "";
        $scope.unSelect = function (curConVal: string) {
            if($scope.curCon){
              $('#' + $scope.curCon).removeClass("selected");
            }
            $('#' + curConVal).addClass("selected");
            $scope.curCon = curConVal;
        };

        $scope.selectGo = function(id: string, type: webimmodel.conversationType){
             if($scope.switchbtn.isFriendList){
               $state.go("main.friendinfo", { userid: id, groupid: "0", targetid: "0", conversationtype: "0" });
             }else{
               $state.go("main.chat", { targetId: id, targetType: type }, { location: "replace" });
             }
        }
        $scope.selectGoGroup = function(id: string, type: webimmodel.conversationType){
             if($scope.switchbtn.isFriendList){
               $state.go("main.groupinfo", { groupid: id, conversationtype: "0" });
             }else{
               $state.go("main.chat", { targetId: id, targetType: type }, { location: "replace" });
             }
        }
        $scope.selectMember = function(item: webimmodel.Member){
          $scope.atShow = false;
        }

        //????????????
        //
        $scope.searchControl = {};

        $scope.$watch('switchbtn.isFriendList', function (newVal: boolean, oldVal: boolean) {
            if (newVal === oldVal)
                return;
            $scope.searchControl.clear();
        });
        $scope.search = function(content: string) {
            if (content.trim()) {
                var friendList = [].concat.apply([], mainDataServer.contactsList.subgroupList.map(function(item) { return item.list }));
                $scope.switchbtn.issearchList = true;
                $scope.searchList = <any>{};
                $scope.searchList.friendList = mainDataServer.contactsList.find(content, friendList) || [];

                $scope.searchList.groupList = mainDataServer.contactsList.find(content, mainDataServer.contactsList.groupList) || [];
            } else {
                $scope.switchbtn.issearchList = false;
            }
        }

        $scope.tonotification = function() {
            mainDataServer.notification.hasNewNotification = false;
            $state.go("main.notification");
        }

        $scope.showPasteDiv = function(visible: boolean){
            $scope.$broadcast('showPasteDiv', visible);
        }

        $scope.uploadPasteImage = function(){
            $scope.$broadcast('uploadPasteImage');
        }

        $scope.checkSend = function (e: any) {
            var pic = <any>document.getElementsByClassName("previewPic")[0];
            if(e.keyCode === 13 && pic.style.visibility == 'visible'){
              $scope.uploadPasteImage();
              e.preventDefault();
            }
        };

        function refreshconversationList() {
            $scope.mainData.conversation.updateConversations();
        }

        $scope.$on("conversationChange", function() {
            refreshconversationList();
        })

        $scope.$watch("mainData.conversation.totalUnreadCount", function(newVal: any, oldVal: any) {
            if (newVal == oldVal) {
                return;
            }
            if (window.Electron) {
                window.Electron.updateBadgeNumber(newVal);
            }
        });

        //?????????????????????????????????????????????
        window.onfocus = function() {
            // if ($state.is("main.chat")) {
            //     RongIMSDKServer.clearUnreadCount(mainDataServer.conversation.currentConversation.targetType, mainDataServer.conversation.currentConversation.targetId);
            //     mainDataServer.conversation.updateConversations();
            // }
        }


        //?????????????????????????????????????????????
        $scope.$on("$viewContentLoaded", function() {
            if ($state.is("main")) {
                $scope.showState.isChat = false;
            } else {
                $scope.showState.isChat = true;
            }

            function pageLayout() {
                if (document.documentElement.clientWidth < 600) {
                    $scope.showState.isPhone = true;
                    var ele = <any>document.querySelector(".mainBox");
                    if (ele) {
                        ele.style.width = document.documentElement.clientWidth - parseFloat(getComputedStyle(document.querySelector(".toolbar")).width) + "px";
                    }
                } else {
                    $scope.showState.isPhone = false;
                    var ele = <any>document.querySelector(".mainBox");
                    if (ele) {
                        ele.style.width = '314px';
                    }
                }
                var chat = document.getElementById("chatArea");
                if (chat) {
                    chat.style.height = document.documentElement.clientHeight - 54 + "px";
                }
                var arr = <any>document.getElementsByClassName("communicateList");
                for (let i = 0, len = arr.length; i < len; i++) {
                    arr[i].style.height = document.documentElement.clientHeight - 54 + "px";
                }
                if (document.getElementById("Messages")) {
                    document.getElementById("Messages").style.height = document.documentElement.clientHeight -
                        parseFloat(getComputedStyle(document.querySelector('.inputBox')).height) -
                        parseFloat(getComputedStyle(document.querySelector('.box_hd')).height) + "px";
                }
                if (document.getElementById("functionBox")) {
                    document.getElementById("functionBox").style.height = document.documentElement.clientHeight -
                        parseFloat(getComputedStyle(document.querySelector('.box_hd')).height) + "px";
                }
            }

            function adjustNoNet() {
                var ele = document.getElementById("Messages");
                var err = <any>document.getElementsByClassName("no_network");
                if (!ele || !err[0])
                    return;
                err[0].style.width = getComputedStyle(document.querySelector('#Messages')).width;
            }

            pageLayout();
            adjustNoNet();

            $window.onresize = function() {
                pageLayout();
                adjustNoNet();
                $scope.$apply();
            }

        });
        $scope.$on('reconnect', function () {
            reconnectServer();
        });


        //?????????????????????   ???????????????????????????????????????????????????
        mainDataServer.notification.notificationList = [];
        mainDataServer.contactsList.subgroupList = [];
        mainServer.friend.getAll().success(function(rep) {
            var arr = rep.result;
            for (let i = 0, len = arr.length; i < len; i++) {
                switch (arr[i].status) {
                    case webimmodel.FriendStatus.Agreed:
                        mainDataServer.contactsList.addFriend(new webimmodel.Friend({
                            id: arr[i].user.id,
                            name: arr[i].displayName || arr[i].user.nickname,
                            imgSrc: arr[i].user.portraitUri,
                        }));
                        break;
                    case webimmodel.FriendStatus.Requested:
                        mainDataServer.notification.addNotification(new webimmodel.NotificationFriend({
                            id: arr[i].user.id,
                            name: arr[i].user.nickname,
                            portraitUri: arr[i].user.portraitUri,
                            status: arr[i].status,
                            content: arr[i].message,
                            timestamp: (new Date(arr[i].updatedAt)).getTime()
                        }));
                        break;
                }
            }

            mainDataServer.notification._sort();
        }).error(function(e) {
            console.log(e);
        })

        //????????????????????????
        mainDataServer.blackList.list = [];
        mainServer.user.getBlackList().success(function(rep) {
            var blist = rep.result;
            for (var i = 0, len = blist.length; i < len; i++) {
                mainDataServer.blackList.add(new webimmodel.Friend({
                    id: blist[i].user.id,
                    name: blist[i].user.nickname,
                    imgSrc: blist[i].user.portraitUri
                }));
            }
        }).error(function() {

        });

        //?????????????????????
        mainDataServer.contactsList.groupList = [];
        mainServer.user.getMyGroups().success(function(rep) {
            var groups = rep.result;
            for (var i = 0, len = groups.length; i < len; i++) {
                var group = new webimmodel.Group({
                    id: groups[i].group.id,
                    name: groups[i].group.name,
                    imgSrc: groups[i].group.portraitUri,
                    upperlimit: 500,
                    fact: 1,
                    creater: groups[i].group.creatorId
                });
                mainDataServer.contactsList.addGroup(group);
                //???????????????
                !function(groupid: string) {
                    mainServer.group.getGroupMember(group.id).success(function(rep) {
                        var members = rep.result;
                        for (var j = 0, len = members.length; j < len; j++) {
                            var member = new webimmodel.Member({
                                id: members[j].user.id,
                                name: members[j].user.nickname,
                                imgSrc: members[j].user.portraitUri,
                                role: members[j].role,
                                displayName: members[j].displayName
                            });
                            mainDataServer.contactsList.addGroupMember(groupid, member);
                        }
                    });
                } (group.id);
            }
        }).error(function(err) {

        })

        RongIMSDKServer.init(appconfig.getAppKey());

        if(mainDataServer.loginUser.token){
          RongIMSDKServer.connect(<string>mainDataServer.loginUser.token).then(function(userId) {
              console.log("connect success1:" + userId);
              RongIMSDKServer.getConversationList().then(function(list) {
                  mainDataServer.conversation.updateConversations();
              });
          }, function(error) {
              if (error.tokenError) {
                  //token ?????????
                  mainServer.user.getToken().success(function(data: any) {
                      if (data.code == "200") {
                          RongIMSDKServer.connect(<string>data.result.token).then(function(userId) {
                              console.log("connect success2:" + userId);
                              RongIMSDKServer.getConversationList().then(function(list) {
                                  mainDataServer.conversation.updateConversations();
                              });
                          }, function(error) {
                              if (error.tokenError) {
                                  //token ?????????
                                  console.log('token error');
                              }
                              //????????????
                              //TODO:???????????????
                          });
                      } else {
                          $state.go("account.signin");
                      }
                  }).error(function(e) {
                      $state.go("account.signin");
                  });
              }
              //????????????
              //TODO:???????????????
          });
        }else{
          mainServer.user.getToken().success(function(data: any) {
              if (data.code == "200") {
                  RongIMSDKServer.connect(<string>data.result.token).then(function(userId) {
                      console.log("connect success3:" + userId);
                      RongIMSDKServer.getConversationList().then(function(list) {
                          mainDataServer.conversation.updateConversations();
                      });
                  }, function(error) {
                      if (error.tokenError) {
                          //token ?????????
                      }
                      //????????????
                      //TODO:???????????????
                  });
              } else {
                  $state.go("account.signin");
              }
          }).error(function(e) {
              $state.go("account.signin");
          });
        }



        var isReconnect = true;
        RongIMSDKServer.setConnectionStatusListener({
            onChanged: function(status: number) {
                var myDate = new Date();
                switch (status) {
                    //????????????
                    case RongIMLib.ConnectionStatus.CONNECTED:
                        console.log('????????????', myDate.toLocaleString());
                        mainDataServer.isConnected = true;
                        showDisconnectErr(false);
                        isConnecting = false;
                        break;
                    //????????????
                    case RongIMLib.ConnectionStatus.CONNECTING:
                        console.log('????????????');
                        break;
                    //????????????
                    case RongIMLib.ConnectionStatus.DISCONNECTED:
                        console.log('????????????');
                        if (!$state.is("account.signin")) {
                            $state.go("account.signin");
                        }
                        break;
                    //??????????????????
                    case RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
                        console.log('??????????????????');
                        if (!$state.is("account.signin")) {
                            $state.go("account.signin");
                            webimutil.Helper.alertMessage.error("?????????????????????????????????!");
                            webimutil.NotificationHelper.showNotification({
                                title: "SealTalk",
                                icon: "assets/img/SealTalk.ico",
                                body: "?????????????????????????????????!"
                            })
                            if (window.Electron) {
                                window.Electron.kickedOff();
                            }
                        }
                        break;
                    //???????????????
                    case RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE:
                        console.log('???????????????', myDate.toLocaleString(), 'isConnecting:' + isConnecting);
                        mainDataServer.isConnected = false;
                        showDisconnectErr(true);
                        // if(!isConnecting){
                          isConnecting = true;
                          checkNetwork({
                              onSuccess: function() {
                                  reconnectServer();
                              }
                          })
                        // }
                        break;
                }
            }
        })

        webimutil.NotificationHelper.onclick = function(n) {
            if (n.data)
                $state.go("main.chat", { targetId: n.data.targetId, targetType: n.data.targetType });
        }

        var typingTimeID: any;
        var timeOfflineMsg: any;
        RongIMSDKServer.setOnReceiveMessageListener({
            onReceived: function(data: RongIMLib.Message) {
                if ($scope.mainData.loginUser.hasSound) {
                    var eleplay = <any>document.getElementById("playsound");
                    eleplay.play();
                }
                var msg = <any>webimmodel.Message.formatGIFMsg(data);
                msg = <any>webimmodel.Message.convertMsg(msg);

                //?????????????????????targetid??????
                // if (msg.targetId == "") {
                //     msg.targetId = mainDataServer.loginUser.id;
                //     RongIMSDKServer.removeConversation(webimmodel.conversationType.Private, "").then(function() {
                //         refreshconversationList();
                //     });
                //     return;
                // }
                //TODO ???????????????
                if (msg.targetId == "") {
                    msg.targetId = mainDataServer.loginUser.id;
                }

                // if ($state.is("main.chat") && !document.hidden) {
                if ($state.is("main.chat")) {
                    RongIMSDKServer.clearUnreadCount(mainDataServer.conversation.currentConversation.targetType, mainDataServer.conversation.currentConversation.targetId);
                }

                switch (data.messageType) {
                    case webimmodel.MessageType.ContactNotificationMessage:
                        RongIMSDKServer.clearUnreadCount(data.conversationType, data.targetId);
                        if (data.hasReceivedByOtherClient) {
                            //??????????????????????????????????????????
                            break;
                        }
                        var contact = <webimmodel.ContactNotificationMessage>msg.content;
                        RongIMSDKServer.removeConversation(msg.conversationType, msg.targetId).then(function() {
                            refreshconversationList();
                        });

                        if (contact.operation == "Request") {
                            //????????????
                            //???????????????
                            //TODO:?????????????????????????????????????????????????????????????????????
                            if (!$state.is("main.notification")) {
                                $scope.mainData.notification.hasNewNotification = true;
                            }
                            var item = new webimmodel.NotificationFriend({
                                id: contact.sourceUserId,
                                name: contact.senderUserName,
                                portraitUri: contact.senderUserImgSrc,
                                content: contact.content,
                                status: webimmodel.FriendStatus.Requested + "",
                                timestamp: (msg.sentTime && msg.sentTime.getTime())
                            });
                            if (!item.name) {
                                //????????????????????????????????????
                                mainServer.user.getInfo(contact.sourceUserId).success(function(rep) {
                                    item.name = rep.result.nickname;
                                    item.portraitUri = rep.result.portraitUri;
                                    item.firstchar = webimutil.ChineseCharacter.getPortraitChar(item.name);
                                    mainDataServer.notification.addNotification(item);
                                }).error(function() {
                                })
                            }else{
                                mainDataServer.notification.addNotification(item);
                            }
                        } else if (contact.operation == "AcceptResponse") {
                            //???????????????
                            //???????????????????????????or??????????????????
                            var friend = mainDataServer.contactsList.getFriendById(contact.sourceUserId);
                            if (!friend) {
                                mainServer.user.getInfo(contact.sourceUserId).success(function(rep) {
                                    var res = rep.result;
                                    mainDataServer.contactsList.addFriend(new webimmodel.Friend({
                                        id: res.id,
                                        name: res.nickname,
                                        imgSrc: res.portraitUri
                                    }));
                                    refreshconversationList();
                                }).error(function() {
                                    mainDataServer.contactsList.addFriend(new webimmodel.Friend({
                                        id: contact.sourceUserId,
                                        name: "????????????????????????",
                                        imgSrc: ""
                                    }));
                                    refreshconversationList();
                                    // throw new Error("????????????????????????");
                                })
                            }
                        }
                        break;
                    case webimmodel.MessageType.DiscussionNotificationMessage:
                        break;
                    case webimmodel.MessageType.VoiceMessage:
                        msg.isUnReade = true;
                    case webimmodel.MessageType.TextMessage:
                    case webimmodel.MessageType.LocationMessage:
                    case webimmodel.MessageType.ImageMessage:
                    case webimmodel.MessageType.RichContentMessage:
                    case webimmodel.MessageType.FileMessage:
                        //????????????????????????
                        if ($state.is("main.chat") && !document.hidden && msg.conversationType == webimmodel.conversationType.Private && msg.senderUserId == mainDataServer.conversation.currentConversation.targetId) {
                          mainDataServer.isTyping = false;
                        }
                        if ($state.is("main.chat") && !document.hidden && msg.senderUserId != mainDataServer.loginUser.id && msg.conversationType == webimmodel.conversationType.Private){
                          if(data.offLineMessage){
                            mainDataServer.conversation.lastOfflineMsg = data;
                            if(!timeOfflineMsg && mainDataServer.conversation.lastOfflineMsg){
                              timeOfflineMsg = setTimeout(function () {
                                conversationServer.sendReadReceiptMessage(mainDataServer.conversation.currentConversation.targetId, mainDataServer.conversation.currentConversation.targetType, mainDataServer.conversation.lastOfflineMsg.messageUId, mainDataServer.conversation.lastOfflineMsg.sentTime);
                                timeOfflineMsg = null;
                              }, 1000);
                            }
                          }
                          else{
                            conversationServer.sendReadReceiptMessage(mainDataServer.conversation.currentConversation.targetId, mainDataServer.conversation.currentConversation.targetType, data.messageUId, data.sentTime);
                          }
                        }

                        // if ($state.is("main.chat") && !document.hidden && msg.senderUserId != mainDataServer.loginUser.id && msg.conversationType == webimmodel.conversationType.Group){
                        //   conversationServer.sendSyncReadStatusMessage(mainDataServer.conversation.currentConversation.targetId, mainDataServer.conversation.currentConversation.targetType, data.sentTime);
                        // }
                        addmessage(msg);
                        //TODO ?????????@???????????????
                        if(msg.mentionedInfo){
                          var isAtMe = false;
                          if(msg.mentionedInfo.type == webimmodel.AtTarget.All){
                            isAtMe = true;
                          }
                          if(msg.mentionedInfo.type == webimmodel.AtTarget.Part){
                            for(var j = 0; j < msg.mentionedInfo.userIdList.length; j++){
                               if(msg.mentionedInfo.userIdList[j] == mainDataServer.loginUser.id){
                                 isAtMe = true;
                               }
                            }
                          }
                          if(isAtMe){
                            conversationServer.addAtMessage(msg.targetId, msg.conversationType, msg);
                          }
                        }

                        var isself = mainDataServer.loginUser.id == msg.senderUserId;
                        if(isself || $state.is("main.chat") && !document.hidden && msg.conversationType == mainDataServer.conversation.currentConversation.targetType && msg.senderUserId == mainDataServer.conversation.currentConversation.targetId){
                          RongIMSDKServer.clearUnreadCount(msg.conversationType, msg.targetId);
                          var curCon = mainDataServer.conversation.getConversation(msg.conversationType, msg.targetId);
                          if (curCon) {
                              curCon.atStr = '';
                              mainDataServer.conversation.totalUnreadCount = mainDataServer.conversation.totalUnreadCount - curCon.unReadNum;
                              curCon.unReadNum = 0;
                          }
                        }
                        else{
                          if (msg.senderUserName) {
                              webimutil.NotificationHelper.showNotification({
                                  title: msg.senderUserName,
                                  icon: "assets/img/SealTalk.ico",
                                  body: webimmodel.Message.messageToNotification(data, mainDataServer.loginUser.id, true), data: { targetId: msg.targetId, targetType: msg.conversationType }
                              });
                          }
                          else {
                              mainServer.user.getInfo(msg.senderUserId).then(function (rep) {
                                  msg.senderUserName = rep.data.result.nickname;
                                  webimutil.NotificationHelper.showNotification({
                                      title: msg.senderUserName + "(?????????)",
                                      icon: "assets/img/SealTalk.ico",
                                      body: webimmodel.Message.messageToNotification(data, mainDataServer.loginUser.id, true), data: { targetId: msg.targetId, targetType: msg.conversationType }
                                  });
                              });
                          }
                        }
                        break;
                    case webimmodel.MessageType.GroupNotificationMessage:
                        if (data.objectName == "ST:GrpNtf" && !data.hasReceivedByOtherClient) {
                            //???????????????????????????????????????????????????????????????
                            var groupNotification = <any>data.content;
                            var isself = false;
                            if(groupNotification.operatorUserId == mainDataServer.loginUser.id){
                              isself = true;
                            }
                            switch (groupNotification.operation) {
                                case "Add":
                                    var changemembers = groupNotification.data.data.targetUserIds.join().split(",");
                                    var groupid = data.targetId;
                                    var self = changemembers.indexOf(mainDataServer.loginUser.id + "");
                                    if (self == -1) {
                                        for (var a = 0, len = changemembers.length; a < len; a++) {
                                            mainServer.user.getInfo(changemembers[a]).success(function(rep) {
                                                mainDataServer.contactsList.addGroupMember(groupid, new webimmodel.Member({
                                                    id: rep.result.id,
                                                    name: rep.result.nickname,
                                                    imgSrc: rep.result.portraitUri,
                                                    role: "1"
                                                }));
                                            }).error(function() {

                                            });
                                        }
                                    } else {
                                        mainServer.group.getById(groupid).success(function(rep) {

                                            var temporarynotifi = new webimmodel.WarningNoticeMessage(groupNotification.data.data.operatorNickname + "????????????????????????");
                                            mainDataServer.notification.addNotification(temporarynotifi);
                                            if (!$state.is("main.notification")) {
                                                mainDataServer.notification.hasNewNotification = true;
                                            }

                                            mainDataServer.contactsList.addGroup(new webimmodel.Group({
                                                id: rep.result.id,
                                                name: rep.result.name,
                                                imgSrc: rep.result.portraitUri,
                                                upperlimit: 500,
                                                fact: 1,
                                                creater: rep.result.creatorId
                                            }));
                                            mainServer.group.getGroupMember(groupid).success(function(rep) {
                                                var members = rep.result;
                                                for (var j = 0, len = members.length; j < len; j++) {
                                                    var member = new webimmodel.Member({
                                                        id: members[j].user.id,
                                                        name: members[j].user.nickname,
                                                        imgSrc: members[j].user.portraitUri,
                                                        role: members[j].role,
                                                        displayName: members[j].displayName
                                                    });
                                                    mainDataServer.contactsList.addGroupMember(groupid, member);
                                                }
                                            });
                                            refreshconversationList();
                                        }).error(function() {

                                        })
                                    }
                                    break;
                                case "Quit":
                                    var changemembers = groupNotification.data.data.targetUserIds.join().split(",");
                                    var groupid = data.targetId;
                                    var self = changemembers.indexOf(mainDataServer.loginUser.id + "");
                                    if (self == -1) {
                                        mainDataServer.contactsList.removeGroupMember(groupid, changemembers[0]);
                                    } else {
                                        mainDataServer.contactsList.removeGroup(groupid);

                                        RongIMSDKServer.removeConversation(webimmodel.conversationType.Group, groupid).then(function() {
                                            refreshconversationList();
                                        });
                                    }
                                    break;
                                case "Kicked":
                                    var changemembers = groupNotification.data.data.targetUserIds.join().split(",");
                                    var groupid = data.targetId;
                                    var groupname = mainDataServer.contactsList.getGroupById(groupid) ? mainDataServer.contactsList.getGroupById(groupid).name : groupid;
                                    var self = changemembers.indexOf(mainDataServer.loginUser.id + "");
                                    if (self == -1) {
                                        for (var a = 0, len = changemembers.length; a < len; a++) {
                                            mainDataServer.contactsList.removeGroupMember(groupid, changemembers[a]);
                                        }
                                    } else {
                                        var temporarynotifi = new webimmodel.WarningNoticeMessage(groupNotification.data.data.operatorNickname + '?????????????????????');
                                        mainDataServer.notification.addNotification(temporarynotifi);
                                        if (!$state.is("main.notification")) {
                                            mainDataServer.notification.hasNewNotification = true;
                                        }
                                        mainDataServer.contactsList.removeGroup(groupid);
                                        RongIMSDKServer.removeConversation(webimmodel.conversationType.Group, groupid).then(function() {
                                            refreshconversationList();
                                        });
                                        //??????????????????
                                        if ($state.is("main.chat") && $state.params["targetId"] == groupid && $state.params["targetType"] == webimmodel.conversationType.Group) {
                                            $state.go("main");
                                        }
                                    }
                                    break;
                                case "Rename":
                                    // console.log("TODO:???????????????????????????");

                                    var groupid = data.targetId;
                                    var groupname = mainDataServer.contactsList.getGroupById(groupid) ? mainDataServer.contactsList.getGroupById(groupid).name : groupid;
                                    var operator = isself ? "???" : groupNotification.data.data.operatorNickname;
                                    var temporarynotifi = new webimmodel.WarningNoticeMessage(operator + ' ??????????????????' + groupNotification.data.data.targetGroupName);
                                    mainDataServer.notification.addNotification(temporarynotifi);
                                    if (!$state.is("main.notification")) {
                                        mainDataServer.notification.hasNewNotification = true;
                                    }
                                    mainDataServer.contactsList.updateGroupNameById(groupid, groupNotification.data.data.targetGroupName);
                                    mainDataServer.conversation.updateConversationTitle(webimmodel.conversationType.Group, groupid, groupNotification.data.data.targetGroupName);
                                    break;
                                case "Create":
                                    var groupid = data.targetId;
                                    mainServer.group.getById(groupid).success(function (rep) {
                                        var operator = isself ? "???" : groupNotification.data.data.operatorNickname;
                                        var temporarynotifi = new webimmodel.WarningNoticeMessage(operator + "???????????????");
                                        mainDataServer.notification.addNotification(temporarynotifi);
                                        if (!$state.is("main.notification")) {
                                            mainDataServer.notification.hasNewNotification = true;
                                        }
                                        mainDataServer.contactsList.addGroup(new webimmodel.Group({
                                            id: rep.result.id,
                                            name: rep.result.name,
                                            imgSrc: rep.result.portraitUri,
                                            upperlimit: 500,
                                            fact: 1,
                                            creater: rep.result.creatorId
                                        }));
                                        mainServer.group.getGroupMember(groupid).success(function (rep) {
                                            var members = rep.result;
                                            for (var j = 0, len = members.length; j < len; j++) {
                                                var member = new webimmodel.Member({
                                                    id: members[j].user.id,
                                                    name: members[j].user.nickname,
                                                    imgSrc: members[j].user.portraitUri,
                                                    role: members[j].role,
                                                    displayName: members[j].displayName
                                                });
                                                mainDataServer.contactsList.addGroupMember(groupid, member);
                                            }
                                        });
                                        refreshconversationList();
                                    }).error(function () {
                                    });
                                    break;
                                case "Dismiss":
                                    var groupid = data.targetId;
                                    var groupname = mainDataServer.contactsList.getGroupById(groupid) ? mainDataServer.contactsList.getGroupById(groupid).name : groupid;
                                    var operator = isself ? "???" : groupNotification.data.data.operatorNickname;
                                    var temporarynotifi = new webimmodel.WarningNoticeMessage(operator + "???????????????");
                                    mainDataServer.notification.addNotification(temporarynotifi);
                                    if (!$state.is("main.notification")) {
                                        mainDataServer.notification.hasNewNotification = true;
                                    }
                                    mainDataServer.contactsList.removeGroup(groupid);
                                    RongIMSDKServer.removeConversation(webimmodel.conversationType.Group, groupid).then(function() {
                                        refreshconversationList();
                                    });
                                    //??????????????????
                                    if ($state.is("main.chat") && $state.params["targetId"] == groupid && $state.params["targetType"] == webimmodel.conversationType.Group) {
                                        $state.go("main");
                                    }
                                    break;
                                default:
                                    console.log("?????????????????????" + groupNotification.operation);
                            }
                            conversationServer.asyncConverGroupNotifition(data, msg);
                            addmessage(msg);
                        }
                        break;
                    case webimmodel.MessageType.InformationNotificationMessage:
                           addmessage(msg);
                        break;
                    case webimmodel.MessageType.ReadReceiptMessage:
                           //????????????????????????,??????????????????
                           if(msg.objectName == 'RC:ReadNtf' && msg.senderUserId == mainDataServer.loginUser.id){
                             RongIMSDKServer.clearUnreadCount(msg.conversationType, msg.targetId);
                             var curCon = mainDataServer.conversation.getConversation(msg.conversationType, msg.targetId);
                             if (curCon) {
                                 curCon.atStr = '';
                                 mainDataServer.conversation.totalUnreadCount = mainDataServer.conversation.totalUnreadCount - curCon.unReadNum;
                                 curCon.unReadNum = 0;
                             }
                             //???????????????????????????
                           }
                        break;
                    case webimmodel.MessageType.RecallCommandMessage:
                        if(msg.objectName == 'RC:RcCmd'){
                            var withDrawMsg = <any>data.content;
                            conversationServer.addWithDrawMessageCache(msg.senderUserId, msg.conversationType, withDrawMsg.messageUId);
                            conversationServer.delWithDrawMessage(msg.senderUserId, msg.conversationType, withDrawMsg.messageUId);
                            if(msg.senderUserId == mainDataServer.loginUser.id){
                              msg.content = '???' + msg.content;
                            }
                            else{
                              conversationServer.messageAddUserInfo(msg);
                              msg.content = msg.senderUserName + msg.content;
                            }
                            addmessage(msg);
                        }
                        break;
                    case webimmodel.MessageType.TypingStatusMessage:
                        //???????????????????????????????????????
                        if ($state.is("main.chat") && !document.hidden && msg.conversationType == webimmodel.conversationType.Private && msg.senderUserId == mainDataServer.conversation.currentConversation.targetId) {
                            mainDataServer.isTyping = true;
                            if(typingTimeID){ clearTimeout(typingTimeID);}
                            typingTimeID = setTimeout(function () {
                              mainDataServer.isTyping = false;
                              $scope.$apply();
                            }, 6000);
                        }

                        break;
                    case webimmodel.MessageType.InviteMessage:
                    case webimmodel.MessageType.HungupMessage:
                        //???????????????????????????????????????
                        // msg.content = msg.senderUserName + msg.content;
                        addmessage(msg);
                        break;
                    case webimmodel.MessageType.ReadReceiptRequestMessage:
                        if ($state.is("main.chat") && !document.hidden && msg.conversationType == webimmodel.conversationType.Group && msg.targetId == mainDataServer.conversation.currentConversation.targetId) {
                          RongIMSDKServer.sendReceiptResponse(msg.conversationType, msg.targetId).then(function() {
                              console.log('sendReadReceiptResponseMessage success');
                          }, function(error) {
                              console.log('sendReadReceiptResponseMessage error', error.errorCode);
                          });
                        }
                        break;
                    case webimmodel.MessageType.ReadReceiptResponseMessage:
                        // var ids = msg.content.receiptMessageDic[RongIMLib.Bridge._client.userId];
                        var receiptResponseItem = <any>data.content;
                        var ids = receiptResponseItem.receiptMessageDic[mainDataServer.loginUser.id];
                        if(!ids){
                           return;
                        }
                        for(var i = 0, len = ids.length; i < len; i++){
                            // console.log(ids[i], msg.receiptResponse[ids[i]]);
                            var itemById = conversationServer.getMessageById(msg.targetId, msg.conversationType, ids[i]);
                            if(itemById && msg.receiptResponse && msg.receiptResponse[ids[i]]){
                              itemById.receiptResponse = msg.receiptResponse;
                              // $('#' + ids[i]).find('span.receiptResponse').text(msg.receiptResponse[ids[i]] + '?????????');
                            }

                            //??????,????????????????????????receiptResponse
                        }
                        break;
                    case webimmodel.MessageType.SyncReadStatusMessage:
                        RongIMSDKServer.clearUnreadCount(msg.conversationType, msg.targetId);
                        var curCon = mainDataServer.conversation.getConversation(msg.conversationType, msg.targetId);
                        if (curCon) {
                            curCon.atStr = '';
                            mainDataServer.conversation.totalUnreadCount = mainDataServer.conversation.totalUnreadCount - curCon.unReadNum;
                            curCon.unReadNum = 0;
                        }
                        break;
                    default:
                        console.log(data.messageType + "????????????")
                        break;
                }

                // $scope.mainData.conversation.updateConversations();
                $scope.mainData.conversation.updateConStatic(msg, true, $state.is("main.chat") && !document.hidden);
                $scope.$apply();

            }
        })

        function addmessage(msg: webimmodel.Message) {
            var hislist = conversationServer.historyMessagesCache[msg.conversationType + "_" + msg.targetId] = conversationServer.historyMessagesCache[msg.conversationType + "_" + msg.targetId] || []
            if (hislist.length == 0) {
                hislist.push(new webimmodel.GetHistoryPanel());
                if (msg.sentTime.toLocaleDateString() != (new Date()).toLocaleDateString())
                    hislist.push(new webimmodel.TimePanl(msg.sentTime));
            }
            conversationServer.addHistoryMessages(msg.targetId, msg.conversationType, msg);
            if (msg.messageType == webimmodel.MessageType.ImageMessage) {
                setTimeout(function() {
                    $scope.$broadcast("msglistchange");
                }, 200)
            } else {
                $scope.$broadcast("msglistchange");
            }
        }


        function showDisconnectErr(flag: boolean){
          var ele = <any>document.querySelector(".no_network");
          if (ele) {
              ele.style.visibility = flag ? 'visible' : 'hidden';
          }
          var sendBtn = document.querySelector(".sendBtn");
          if (sendBtn) {
              sendBtn.className = flag ? 'sendBtn disabled' : 'sendBtn';
          }
        }

        var reconnectTimes = 0, timeInterval = 20, timeID: any, reconnectTimeID: any;
        function reconnectServer() {
            if(reconnectTimeID){
              clearTimeout(reconnectTimeID);
            }
            reconnectTimeID = setTimeout(function() {
                RongIMSDKServer.reconnect({
                    onSuccess: function() {
                        var myDate = new Date();
                        reconnectTimes = 0;

                        console.log("reconnectSuccess", myDate.toLocaleString());
                        if (reconnectTimeID) {
                            clearTimeout(reconnectTimeID);
                        }
                        showDisconnectErr(false);
                        isConnecting = false;
                        mainDataServer.isConnected = true;
                        RongIMSDKServer.getConversationList().then(function() {
                            mainDataServer.conversation.updateConversations();
                        });
                    },
                    onError: function() {
                        mainDataServer.isConnected = false;
                        isConnecting = false;
                        if (reconnectTimes <= 5) {
                            reconnectServer();
                            reconnectTimes += 1;
                        } else {
                            reconnectTimes = 0;
                            var myDate = new Date();
                            console.log("?????????????????????????????????", myDate.toLocaleString());
                        }
                    }
                });
            }, timeInterval * reconnectTimes * 1000);
        }

        function checkNetwork(callback: any) {
            var myDate = new Date();
            console.log('begin checkNetwork', myDate.toLocaleString());
            $http.get("index.html", {
                params: { t: Math.random() }
            }).success(function() {
                if(timeID){
                  clearTimeout(timeID);
                }
                callback && callback.onSuccess && callback.onSuccess();
            }).error(function() {
                showDisconnectErr(true);
                if(timeID){
                  clearTimeout(timeID);
                }
                timeID = setTimeout(function () {
                    checkNetwork(callback);
                }, 5000);
            });
        }


    }]);
