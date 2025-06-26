define(["Satoshi_SatoshiUi/js/content-type/block-directive"], function (
  BlockDirectiveBase
) {
  "use strict";
  const $super = BlockDirectiveBase.prototype;

  function BlockDirective(parent, config, stageId) {
    BlockDirectiveBase.call(this, parent, config, stageId);
  }

  BlockDirective.prototype = Object.create($super);

  var _proto = BlockDirective.prototype;

  /**
   * Parse YouTube parameters from given URL and Autoplay setting from UI
   *
   * @param url string
   * @param data DataObject
   * @returns string
   * @private
   */
  _proto.parseYoutubeGetParams = function parseYoutubeGetParams(url, data) {
    var acceptableYouTubeParams = [
      "rel",
      "controls",
      "autoplay",
      "mute",
      "loop",
      "playlist",
      "cc_lang_pref",
      "cc_load_policy",
      "color",
      "disablekb",
      "end",
      "fs",
      "hl",
      "iv_load_policy",
      "modestbranding",
      "start",
    ];
    var a = document.createElement("a");
    a.href = url;
    var urlGetParams = {};
    a.search
      .slice(a.search.indexOf("?") + 1)
      .split("&")
      .map(function (hash) {
        var _hash$split = hash.split("="),
          key = _hash$split[0],
          val = _hash$split[1];

        urlGetParams[key] = decodeURIComponent(val);
      });
    var filteredGetParams = {};

    for (
      var _i = 0, _acceptableYouTubePar = acceptableYouTubeParams;
      _i < _acceptableYouTubePar.length;
      _i++
    ) {
      var param = _acceptableYouTubePar[_i];

      if (urlGetParams.hasOwnProperty(param)) {
        filteredGetParams[param] = urlGetParams[param];
      }
    }

    if (data.autoplay === "true") {
      filteredGetParams.autoplay = "1";
      filteredGetParams.mute = "1";
    } else {
      delete filteredGetParams.autoplay;
      delete filteredGetParams.mute;
    }

    var processedGetParams = [];

    for (var _param in filteredGetParams) {
      if (filteredGetParams.hasOwnProperty(_param)) {
        processedGetParams.push(
          encodeURI(_param + "=" + filteredGetParams[_param])
        );
      }
    }

    return processedGetParams.length > 0
      ? "?" + processedGetParams.join("&")
      : "";
  };

  _proto.getAdditionalBlockAttributes = function getAdditionalBlockAttributes(
    data
  ) {
    // Parse video url
    let src = data.video_source;
    const youtubeRegExp = new RegExp(
      "^(?:https?://|//)?(?:www\\.|m\\.)?" +
        "(?:youtu\\.be/|youtube\\.com/(?:embed/|v/|watch\\?v=|watch\\?.+&v=))([\\w-]{11})(?![\\w-])"
    );
    const vimeoRegExp = new RegExp(
      "https?://(?:www\\.|player\\.)?vimeo.com/(?:channels/" +
        "(?:\\w+/)?|groups/([^/]*)/videos/|album/(\\d+)/video/|video/|)(\\d+)(?:$|/|\\?)"
    );
    if (youtubeRegExp.test(src)) {
      src =
        "https://www.youtube.com/embed/" +
        youtubeRegExp.exec(src)[1] +
        _proto.parseYoutubeGetParams(src, data);
    } else if (vimeoRegExp.test(src)) {
      src =
        "https://player.vimeo.com/video/" +
        vimeoRegExp.exec(src)[3] +
        "?title=0&byline=0&portrait=0" +
        (data.autoplay === "true" ? "&autoplay=1&autopause=0&muted=1" : "");
    }

    return {
      heading: data.heading,
      subheading: data.subheading,
      video_source: src,
      autoplay: data.autoplay,
      ...(data.image[0] ? { image: data.image[0].url } : {}),
    };
  };

  return BlockDirective;
});
