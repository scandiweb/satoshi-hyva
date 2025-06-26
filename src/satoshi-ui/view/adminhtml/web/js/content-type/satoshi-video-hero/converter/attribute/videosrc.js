/*eslint-disable */
/* jscs:disable */
define(["Magento_PageBuilder/js/utils/object"], function (_object) {
  /**
   * Copyright © Magento, Inc. All rights reserved.
   * See COPYING.txt for license details.
   */
  var VideoSrc = /*#__PURE__*/function () {
    "use strict";

    function VideoSrc() {
    }

    /**
     * Parse YouTube parameters from given URL and Autoplay setting from UI
     *
     * @param url string
     * @param data DataObject
     * @returns string
     * @private
     */
    VideoSrc.parseYoutubeGetParams = function parseYoutubeGetParams(url, data, id) {
      var acceptableYouTubeParams = ["rel", "controls", "autoplay", "mute", "loop", "playlist", "cc_lang_pref", "cc_load_policy", "color", "disablekb", "end", "fs", "hl", "iv_load_policy", "modestbranding", "start"];
      var a = document.createElement("a");
      a.href = url;
      var urlGetParams = {};
      a.search.slice(a.search.indexOf("?") + 1).split("&").map(function (hash) {
        var _hash$split = hash.split("="),
          key = _hash$split[0],
          val = _hash$split[1];

        urlGetParams[key] = decodeURIComponent(val);
      });
      var filteredGetParams = {};

      for (var _i = 0, _acceptableYouTubePar = acceptableYouTubeParams; _i < _acceptableYouTubePar.length; _i++) {
        var param = _acceptableYouTubePar[_i];

        if (urlGetParams.hasOwnProperty(param)) {
          filteredGetParams[param] = urlGetParams[param];
        }
      }

      if (data.muted === "true") {
        filteredGetParams.mute = "1";
      } else {
        delete filteredGetParams.mute;
      }

      if (data.loop === "true") {
        filteredGetParams.loop = "1";
        filteredGetParams.playlist = id;
      } else {
        delete filteredGetParams.loop;
      }

      if (data.autoplay === "true") {
        filteredGetParams.autoplay = "1";
      } else {
        delete filteredGetParams.autoplay;
      }

      var processedGetParams = [];

      for (var _param in filteredGetParams) {
        if (filteredGetParams.hasOwnProperty(_param)) {
          processedGetParams.push(encodeURI(_param + "=" + filteredGetParams[_param]));
        }
      }

      return processedGetParams.length > 0 ? "?" + processedGetParams.join("&") : "";
    }
    /**
     * Convert value to internal format
     *
     * @param value string
     * @returns {string | object}
     */
    ;

    var _proto = VideoSrc.prototype;

    _proto.fromDom = function fromDom(value) {
      value = value.replace(/\?autoplay=1&mute=1/g, "");
      value = value.replace(/&autoplay=1&mute=1/g, "");
      value = value.replace(/\?title=0&byline=0&portrait=0/g, "");
      value = value.replace(/&autoplay=1&autopause=0&muted=1/g, "");
      return value;
    }
    /**
     * Convert value to knockout format
     *
     * @param name string
     * @param data Object
     * @returns {string}
     */
    ;

    _proto.toDom = function toDom(name, data) {
      var value = (0, _object.get)(data, name);

      if (value === undefined) {
        return "";
      }

      var youtubeRegExp = new RegExp("^(?:https?:\/\/|\/\/)?(?:www\\.|m\\.)?" + "(?:youtu\\.be\/|youtube\\.com\/(?:embed\/|v\/|watch\\?v=|watch\\?.+&v=))([\\w-]{11})(?![\\w-])");
      var vimeoRegExp = new RegExp("https?:\/\/(?:www\\.|player\\.)?vimeo.com\/(?:channels\/" + "(?:\\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\\d+)\/video\/|video\/|)(\\d+)(?:$|\/|\\?)");

      if (youtubeRegExp.test(value)) {
        return "https://www.youtube.com/embed/" + youtubeRegExp.exec(value)[1] + VideoSrc.parseYoutubeGetParams(value, data, youtubeRegExp.exec(value)[1]);
      } else if (vimeoRegExp.test(value)) {
        return "https://player.vimeo.com/video/" +
          vimeoRegExp.exec(value)[3] +
          "?title=0&byline=0&portrait=0" +
          (data.autoplay === "true" ? "&autoplay=1&autopause=0" +
            (data.muted === "true" ? "&muted=1" : "") : "") +
          (data.loop === "true" ? "&loop=1" : "");
      }

      return value;
    };

    return VideoSrc;
  }();

  return VideoSrc;
});
//# sourceMappingURL=videosrc.js.map
