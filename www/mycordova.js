var argscheck = require('cordova/argscheck');
var exec = require('cordova/exec');
var EventEmitter = require('./eventemitter3.js');


var myCordova = {
  version: '0.0.1',
  canLoginWithApple: false,
  eventChannel: new EventEmitter(),

  getVersion: function(){
    return this.version;
  },
  init(){
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },

  initMyCordova(){    
    const bodyEl = document.querySelector('body');
    bodyEl.classList.add('cordova');
    bodyEl.classList.add(this.cordova.platformId);
    try {
      if (this.StatusBar) {
        this.StatusBar.styleDefault();
      }
    } catch (e) {
    }

    if (this.onCordova && this.pushNotification && this.pushService === null) {
      console.log('init cordova push notifications');
      this.cordovaLogger('init cordova push notifications');
      this.pushService = this.pushNotification.init({
        android: {
          forceShow: 'true',
          sound: 'true',
          vibrate: 'true'
        },
        browser: {
          pushServiceURL: 'http://push.api.phonegap.com/v1/push'
        },
        ios: {
          alert: 'true',
          badge: 'true',
          sound: 'true'
        },
        windows: {}
      });

      const __self = this;

      this.pushService.on('registration', (data) => {
        __self.eventChannel.emit('registrationData', data);
      });

      this.pushService.on('notification', (data) => {
        // data.message,
        // data.title,
        // data.count,
        // data.sound,
        // data.image,
        // data.additionalData
        console.log(data);
        __self.badgeClearCounter();
        __self.eventChannel.emit('notification', data);
        __self.eventChannel.emit('currentMessage', data);
        __self.eventChannel.emit('onMessage', data);
      });

      this.pushService.on('error', (e) => {
        // e.message
        console.log(e);
      });
      this.badgeClearCounter();
    }

    if (this.onCordova && this.universalLinks && !this.diplinksDone) {
      console.log('initDeeplinks');
      this.cordovaLogger('initDeeplinks');
      console.log(this.universalLinks);
      this.cordovaLogger(this.universalLinks);

      this.universalLinks.initialize();

      this.universalLinks.subscribe(null, this.deepLinkHandler);

      this.universalLinks.subscribe('launchedAppFromLink', this.deepLinkHandler);

      this.diplinksDone = true;
    }

    if (this.onCordova && this.inAppBrowser) {
      if (!this.inAppBrowserPatched) {
        const w = window;
        this.__open = w.open;
        const _self = this;

        w.open = function (url, target, options) {
          const t = target || '_system';
          const opt = options || '';
          console.log('open in inapp browser', url, target, options);
          try {
            return _self.inAppBrowser.open(url, t, opt);
          } catch (e) {
            console.log(e);
          }
        };
      }
      this.inAppBrowserPatched = true;
    }

    const buildInfo = this.getBuildInfo();
    if (buildInfo) {
      try {
        this.buildInfo = `Version: ${buildInfo.build.version}-${
          buildInfo.build.buildDate.getTime() / 1000}. Platform: ${
          buildInfo.device.platform}-${buildInfo.device.version}`;
      } catch (e) {
      }

    }

    this.SignInWithApple.isAvailable().then(this.setAppleSingInAvailable);

  },
  onDeviceReady: function(){
    this.hideSplashScreen();
    this.initMyCordova();
  },
  get permissions() {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.permissions) {
      return window.cordova.plugins.permissions;
    }
    return null;
  },
  get VideoEditor() {
    return window.VideoEditor;
  },
  
  get ScreenOrientation() {
    return window.screen;
  },
  
  get VideoEditorOptions() {
    return window.VideoEditorOptions;
  },

  get universalLinks() {
    return window.universalLinks;
  },

  get inAppBrowser() {
    return window.cordova.InAppBrowser;
  },

  get socialSharing() {
    if (window.plugins && window.plugins.socialsharing) {
      return window.plugins.socialsharing;
    }
    return null;
  },

  get onCordova(){
    return !!window.cordova;
  },

  get cordova() {
    return window.cordova;
  },

  get notifivationBadge() {
    if (this.onCordova && this.cordova.plugins.notification && this.cordova.plugins.notification.badge) {
      return this.cordova.plugins.notification.badge;
    }
    return null;
  },

  get facebookConnectPlugin() {
    if (this.onCordova && window.facebookConnectPlugin) {
      return window.facebookConnectPlugin;
    }
    return null;
  },

  get signInWithAppleAvailable() {
    return !!this.canLoginWithApple;
  },

  get registration() {
    return this.registrationData;
  },

  get SignInWithApple() {
    if (this.onCordova && window.SignInWithApple) {
      return window.SignInWithApple;
    }
    return null;
  },

  set appleLoginData(data) {
    this.appleData = data;
  },

  get appleLoginData() {
    return this.appleData;
  },
  
  setAppleSingInAvailable(isAvailable) {
    this.canLoginWithApple = isAvailable;
  },

  getFileReader() {
    return new FileReader();
  },
  get navigator() {
    return window.navigator;
  },

  get StatusBar() {
    return window.StatusBar;
  },

  get cordovaCaptureVideo() {
    if (this.navigator && this.navigator.device && this.navigator.device.capture) {
      return this.navigator.device.capture;
    }
    return null;
  },

  get customVideoUpload() {
    if (this.onCordova && this.isCordovaIOS()) {
      return true;
    }
    return false;
  },

  get cordovaCamera() {
    if (this.navigator && this.navigator.camera) {
      return this.navigator.camera;
    }
    return null;
  },
  vibrate(duration) {
    if (this.navigator && this.navigator.vibrate) {
      this.navigator.vibrate(duration);
    }
  },

  finish() {
    if (this.pushService) {
      this.pushService.finish(() => {
        console.log('finish successfully called');
      });
    }
  },

  hideSplashScreen() {
    if (this.onCordova && this.navigator.splashscreen) {
      this.navigator.splashscreen.hide();
    }
  },

  deepLinkHandler(eventData) {
    console.log('Mobile.universalLinks.subscribe event=launchedAppFromLink', eventData);
    this.eventChannel.emit('onRedirect', {
      path: eventData.path,
      params: eventData.params,
      hash: eventData.hash
    });
  },

  sendInvite(url, message) {
    return new Promise((resolve, reject) => {
      if (this.socialSharing) {
        const options = {
          message: message, // not supported on some apps (Facebook, Instagram)
          subject: message, // fi. for email
          // files: [ url ], // an array of filenames either locally or remotely
          url: url,
          // 'additional_callbacks': 'true', //new option to generate additional calls into success
          // chooserTitle: 'Pick an app' // Android only, you can override the default share sheet title
        };

        this.socialSharing.shareWithOptions(options, resolve, reject);
      } else {
        reject('There is no sharing plugin installed');
      }
    });
  },

  badgeDecrementCounter() {
    if (this.notifivationBadge) {
      this.notifivationBadge.decrease(1, function (badge) {
        // badge is now 9 (11 - 2)
      });
    }
  },

  badgeClearCounter() {
    if (this.notifivationBadge) {
      try {
        this.notifivationBadge.clear();
      } catch (e) {
        console.log(e);
      }
    }
  },
  setAppleSingInAvailable(isAvailable) {
    this.canLoginWithApple = isAvailable;
  },

  patchScreenOrientation() {
    if (this.onCordova && this.ScreenOrientation) {
      try {
        this.ScreenOrientation.orientation.lock('portrait');
      } catch (e) {
        console.log(e);
      }
    }
  },

  openExternalLink(url, target, params) {
    if (this.onCordova && this.inAppBrowser) {
      return this.inAppBrowser.open(url, target, 'location=yes,hidenavigationbuttons=yes,toolbarposition=top,hardwareback=no,hideurlbar=yes,toolbarcolor=#ffffff');
    } else {
      return window.open(url, target, params);
    }
  },

  exitApp() {
    if (this.onCordova && this.navigator.app && this.navigator.app.exitApp) {
      this.navigator.app.exitApp();
    }
  },

  readFileAsDataURL(event, callback) {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[ 0 ];
      if (file) {
        const reader = this.getFileReader();

        reader.onloadend = (e) => {
          /*if(reader.error){
            console.log(reader.error)
          } else {
            this.profilePicture = reader.result;
          }*/
          callback.call(callback, e);
        };
        reader.readAsDataURL(file);
      }
    }
  },

  readFileAsArrayBuffer(event, callback) {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[ 0 ];
      if (file) {
        const reader = this.getFileReader();

        reader.onloadend = (e) => {
          /*if(reader.error){
            console.log(reader.error)
          } else {
            this.profilePicture = reader.result;
          }*/
          callback.call(callback, e);
        };
        reader.readAsArrayBuffer(file);
      }
    }
  },

  isCordovaAndroid() {
    if (this.onCordova) {
      return this.cordova.platformId === 'android';
    }
    return false;
  },

  isCordovaIOS() {
    if (this.onCordova) {
      return this.cordova.platformId === 'ios';
    }
    return false;
  },

  sendNotificationToken(data) {
    /*try{
      this.http.post('http://192.168.3.199:8888', data);
    }catch(e){}*/
  },

  getBuildInfo() {
    if (this.onCordova && window.BuildInfo) {
      return {
        build: {
          ...window.BuildInfo
        },
        device: {
          ...window.device
        }
      };
    }
  },

  videoTranscodeProgress(status) {
    console.log('transcodeVideo progress callback, info: ' + status);
    this.eventChannel.emit('onVideoFile', {
      type: 'progress',
      progress: status
    });
  },

  imageConvertingSuccess(result, memeType, success, error) {
    if (result.indexOf('file') !== 0) {
      result = `file://${result}`;
    }
    if (result.indexOf('file:///private/') === 0) {
      result = result.replace('file:///private/', 'file:///');
    }
    console.log('before opening: ', result);
    window.resolveLocalFileSystemURL(result, (fileEntry) => {
      console.log(fileEntry);
      const __self = this;

      fileEntry.file(function (file) {
        const reader = __self.getFileReader();
        console.log('fileEntry.file = ', file);
        reader.onloadend = function (readerData) {
          console.log('Reader data param = ', readerData);
          console.log('Successful file read: ' + this.result);
          const blob = (new Blob([ new Uint8Array(this.result) ], { type: memeType }));
          blob.lastModifiedDate = new Date();
          blob.name = 'image.png';
          const myFile = blob;
          __self.zone.run(() => {

            success({
              image: true,
              video: false,
              type: 'done',
              file: myFile
            });
          });
        };

        reader.readAsArrayBuffer(file);

      }, (err) => {
        console.log(err);
        error(err);
      });

    }, (err) => {
      console.log(err);
      error(err);
    });
  },

  videoTranscodeSuccess(result, success, error) {
    console.log('videoTranscodeSuccess, result: ' + result);
    if (result.indexOf('file') !== 0) {
      result = `file://${result}`;
    }
    if (result.indexOf('file:///private/') === 0) {
      result = result.replace('file:///private/', 'file:///');
    }
    console.log('before opening: ', result);
    window.resolveLocalFileSystemURL(result, (fileEntry) => {
      console.log(fileEntry);
      const __self = this;

      fileEntry.file(function (file) {
        const reader = __self.getFileReader();
        console.log('fileEntry.file = ', file);
        reader.onloadend = function (readerData) {
          console.log('Reader data param = ', readerData);
          console.log('Successful file read: ' + this.result);
          const blob = (new Blob([ new Uint8Array(this.result) ], { type: 'video/mp4' }));
          blob.lastModifiedDate = new Date();
          blob.name = 'file.mp4';
          const myFile = blob;
          
          __self.zone.run(() => {
            success({
              image: false,
              video: true,
              type: 'done',
              file: myFile
            });
            
          });
        };

        reader.readAsArrayBuffer(file);

      }, (err) => {
        console.log(err);
        error(err);
      });

    }, (err) => {
      console.log(err);
      error(err);
    });
  },

  videoTranscodeError(err) {
    console.log('videoTranscodeError, err: ' + err);
  },

  startEditingVideo(fullPath, success, error) {
    const outputFileName = `${v4()}`;
    //console.log(outputFileName, fullPath);
    let fullPathNew = fullPath;
    if (fullPathNew.indexOf('file') !== 0) {
      fullPathNew = `file://${fullPathNew}`;
    }
    
    this.videoTranscodeSuccess(fullPath, success, error);
  },

  recordVideo(success, error) {
    if (this.cordovaCamera && this.VideoEditor) {
      this.cordovaCamera.getPicture(
        (filePath) => {
          if (this.isCordovaAndroid && this.permissions) {
            this.permissions.requestPermissions(
              [
                this.permissions.READ_EXTERNAL_STORAGE,
                this.permissions.WRITE_EXTERNAL_STORAGE,
                this.permissions.RECORD_AUDIO
              ], (status) => {
                if (status.hasPermission) {
                  this.startEditingVideo(filePath, success, error);
                } else {
                  error('lack of permissions');
                }

              }, this.videoTranscodeError);
          } else {
            this.startEditingVideo(filePath, success, error);
          }
        },
        (CaptureError) => {
          error(CaptureError);
        },
        {
          sourceType: this.cordovaCamera.PictureSourceType.PHOTOLIBRARY,
          mediaType: this.cordovaCamera.MediaType.VIDEO,
          destinationType: this.cordovaCamera.DestinationType.FILE_URL
        });
    } else {
      error('can not find a capture plugin or video editor');
    }
  }

};

myCordova.init();

module.exports = myCordova;
