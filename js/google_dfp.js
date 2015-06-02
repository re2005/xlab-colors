window.GADS = (function(GADS){
    var adsManager,adsLoader, adDisplayContainer,intervalTimer,videoContent, _isFullscreen = false;

    GADS.utils = GADS.utils || {};

    GADS.options = {
        width : '',
        height : '',
        adTagUrl : '',
        adsWrapperID : '',
        mediaWrapperID : '',
        testing : false,
        onComplete : function(){},
        onSkip : function(){},
        onClose : function(){},
        onFinish : function(){},
        onError : function(){}
    };

    GADS.utils.extend = function(){
        for(var i=1; i<arguments.length; i++)
            for(var key in arguments[i])
                if(arguments[i].hasOwnProperty(key))
                    arguments[0][key] = arguments[i][key];
        return arguments[0];
    }


    function counter() {
        var count = 15;
        var counter = setInterval(timer, 1000); //1000 will  run it every 1 second
        function timer() {
            count=count-1;
            if (count <= 0)
            {
                clearInterval(counter);
                onFinish();
                return;
            }
            $('#GADS_ad_timer span').html(count);
        }

    };

    function adjust_non_linear() {
        $("#"+GADS.options.mediaWrapperID+" iframe").css("height", "320px");
        $("#"+GADS.options.mediaWrapperID+" :first-child").prepend('<div id="GADS_ad_timer">Ad will close automatically <span>15</span> </div>');
    }

    function init(opt) {
        console.log("GADS DFP start");

        videoContent = document.getElementById('GADS_contentElement');

        if(opt){
            GADS.utils.extend(GADS.options,opt);

            if(GADS.options.width === '' && GADS.options.height === ''){
                _isFullscreen = true;
            }

            if(GADS.options.adTagUrl === ''){
                GADS.options.adTagUrl = GADS.options.testing ? 
                    'http://pubads.g.doubleclick.net/gampad/ads?sz=640x360&iu=/6062/iab_vast_samples/skippable&ciu_szs=300x250,728x90&impl=s&gdfp_req=1&env=vp&output=xml_vast2&unviewed_position_start=1&url=[referrer_url]&correlator=[timestamp]'
                    :'http://pubads.g.doubleclick.net/gampad/ads?sz=640x360&iu=/6062/iab_vast_samples/skippable&ciu_szs=300x250,728x90&impl=s&gdfp_req=1&env=vp&output=xml_vast2&unviewed_position_start=1&url=[referrer_url]&correlator=[timestamp]&cust_params=domain%3D'+window.location.hostname;
            };
            if(GADS.options.mediaWrapperID === '') console.error('GADS media id missing or incorrect');
            else if(GADS.options.adsWrapperID === '') console.error('GADS ads id missing or incorrect');
            else {
                requestAds();
            }
        } else {
            console.error('GADS no options object found');
        }
    }

    var contentEndedListener = function() {adsLoader.contentComplete();};

    function createAdDisplayContainer() {
        // We assume the adContainer is the DOM id of the element that will house
        // the ads.

        try {
            adDisplayContainer =
            new google.ima.AdDisplayContainer(
                document.getElementById(GADS.options.mediaWrapperID));
        } catch (adError) {
            // An error may be thrown if there was a problem with the VAST response.
            onFinish();
        }
     
    }

    function requestAds() {
        document.getElementById(GADS.options.adsWrapperID).style.display = "block";
        // Create the ad display container.
        createAdDisplayContainer();
        // Initialize the container, if requestAds is invoked in a user action.
        // This is only needed on iOS/Android devices.
        adDisplayContainer.initialize();
        // Create ads loader.
        adsLoader = new google.ima.AdsLoader(adDisplayContainer);
        // Listen and respond to ads loaded and error events.
        adsLoader.addEventListener(
            google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
            onAdsManagerLoaded,
            false);
        adsLoader.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            onAdError,
            false);

        // An event listener to tell the SDK that our content video
        // is completed so the SDK can play any post-roll ads.
        videoContent.addEventListener('ended', contentEndedListener);

        // Request video ads.
        var adsRequest = new google.ima.AdsRequest();

        adsRequest.adTagUrl = GADS.options.adTagUrl;

        // Specify the linear and nonlinear slot sizes. This helps the SDK to
        // select the correct creative if multiple are returned.
        adsLoader.requestAds(adsRequest);
    }

    function onAdsManagerLoaded(adsManagerLoadedEvent) {
        // Get the ads manager.
        adsManager = adsManagerLoadedEvent.getAdsManager(
            videoContent);  // See API reference for contentPlayback

        // Add listeners to the required events.
        adsManager.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            onAdError);
        adsManager.addEventListener(
            google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
            onContentPauseRequested);
        adsManager.addEventListener(
            google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
            onContentResumeRequested);
        adsManager.addEventListener(
            google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
            onAdEvent);

        // Listen to any additional events, if necessary.
        adsManager.addEventListener(
            google.ima.AdEvent.Type.LOADED,
            onAdEvent);
        adsManager.addEventListener(
            google.ima.AdEvent.Type.STARTED,
            onAdEvent);
        adsManager.addEventListener(
            google.ima.AdEvent.Type.COMPLETE,
            onAdEvent);
        adsManager.addEventListener(
            google.ima.AdEvent.Type.SKIPPED,
            onAdEvent);
        adsManager.addEventListener(
            google.ima.AdEvent.Type.USER_CLOSE,
            onAdEvent);
        adsManager.addEventListener(
            google.ima.AdEvent.Type.AD_ERROR,
            onAdEvent);

        try {
            //alert(vidHeight,vidWidth)
            // Initialize the ads manager. Ad rules playlist will start at this time.
            if(_isFullscreen === true){
                adsManager.init(document.body.clientWidth, document.body.clientHeight, google.ima.ViewMode.FULLSCREEN);
            } else {
                adsManager.init(GADS.options.width, GADS.options.height, google.ima.ViewMode.NORMAL);
            }
            // Call play to start showing the ad. Single video and overlay ads will
            // start at this time; the call will be ignored for ad rules.
            adsManager.start();
        } catch (adError) {
            // An error may be thrown if there was a problem with the VAST response.
            onFinish();
        }
    }

    window.onresize = function() {
        // Resize ad if fullscreen
        if(adsManager && _isFullscreen){
            adsManager.resize(document.body.clientWidth, document.body.clientHeight, google.ima.ViewMode.FULLSCREEN);
        }
    };


    function onAdEvent(adEvent) {
        // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
        // don't have ad object associated.

        var ad = adEvent.getAd();

        switch (adEvent.type) {
            case google.ima.AdEvent.Type.LOADED:
                // This is the first event sent for an ad - it is possible to
                // determine whether the ad is a video ad or an overlay.
                if (!ad.isLinear()) {
                    // Position AdDisplayContainer correctly for overlay.
                    // Use ad.width and ad.height.
                }
                break;
            case google.ima.AdEvent.Type.STARTED:
                // This event indicates the ad has started - the video player
                // can adjust the UI, for example display a pause button and
                // remaining time.

                if (ad.isLinear()) {
                    // For a linear ad, a timer can be started to poll for
                    // the remaining time.
                    intervalTimer = setInterval(
                        function() {
                            var remainingTime = adsManager.getRemainingTime();
                        },
                        300); // every 300ms
                }
                else {
                    counter();
                    adjust_non_linear();
                }
                break;
            case google.ima.AdEvent.Type.COMPLETE:
                // This event indicates the ad has finished - the video player
                // can perform appropriate UI actions, such as removing the timer for
                // remaining time detection.
                if (ad.isLinear()) {
                    clearInterval(intervalTimer);

                    GADS.options.onComplete.call();
                    onFinish();
                }
                break;
            case google.ima.AdEvent.Type.SKIPPED:
                // This event indicates the ad has skipped - the video player
                // can perform appropriate UI actions, such as removing the timer for
                // remaining time detection.
                if (ad.isLinear()) {
                    GADS.options.onSkip.call();
                    onFinish();                
                }
                break;
            case google.ima.AdEvent.Type.USER_CLOSE:
                // This event indicates the ad has closeed - the video player
                // can perform appropriate UI actions, such as removing the timer for
                // remaining time detection.
                GADS.options.onClose.call();
                onFinish()
                break;

            case google.ima.AdEvent.Type.AD_ERROR:
                // This event indicates the ad has skipped - the video player
                // can perform appropriate UI actions, such as removing the timer for
                // remaining time detection.
                GADS.options.onError.call();
                onFinish();
                break; 
        }
    }

    function onAdError(adErrorEvent) {
        GADS.options.onError.call();
        GADS.options.onFinish.call();

        // Handle the error logging.
        console.log(adErrorEvent.getError());
        if(adsManager) adsManager.destroy();
    }

    function onContentPauseRequested() {
        videoContent.removeEventListener('ended', contentEndedListener);
        videoContent.pause();
        // This function is where you should setup UI for showing ads (e.g.
        // display ad timer countdown, disable seeking etc.)
        // setupUIForAds();
    }

    function onContentResumeRequested() {
        videoContent.addEventListener('ended', contentEndedListener);
        videoContent.play();
        // This function is where you should ensure that your UI is ready
        // to play content. It is the responsibility of the Publisher to
        // implement this function when necessary.
        // setupUIForContent();
    }

    function onFinish(){
        GADS.options.onFinish.call();
    }

    // Wire UI element references and UI event listeners.
    return {
        init : init
    };
})(window.GADS || {});