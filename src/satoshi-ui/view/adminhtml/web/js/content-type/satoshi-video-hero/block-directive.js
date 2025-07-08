define([
  "Satoshi_SatoshiUi/js/content-type/block-directive",
  "Satoshi_SatoshiUi/js/helper/link",
], function (BlockDirectiveBase, linkHelper) {
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
  _proto.parseYoutubeGetParams = function parseYoutubeGetParams(url, data, id) {
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
        processedGetParams.push(
          encodeURI(_param + "=" + filteredGetParams[_param])
        );
      }
    }

    processedGetParams.push("controls=0");

    return processedGetParams.length > 0
      ? "?" + processedGetParams.join("&")
      : "";
  };

  _proto.getAdditionalBlockAttributes = function getAdditionalBlockAttributes(
    data
  ) {
    const tidyLink = linkHelper.prototype.tidyLink;

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
        _proto.parseYoutubeGetParams(src, data, youtubeRegExp.exec(src)[1]);
    } else if (vimeoRegExp.test(src)) {
      src =
        "https://player.vimeo.com/video/" +
        vimeoRegExp.exec(src)[3] +
        "?title=0&byline=0&portrait=0" +
        (data.autoplay === "true" ? "&autoplay=1&autopause=0" : "") +
        (data.muted === "true" ? "&muted=1" : "") +
        (data.loop === "true" ? "&loop=1" : "");
    }

    return {
      banner_height: data.banner_height,
      desktop_content_position: data.desktop_content_position,
      mobile_content_alignment: data.mobile_content_alignment,
      heading: data.heading,
      description: data.description,
      button_label: data.button_label,
      button_link: JSON.stringify(tidyLink(data.button_link)),
      button_type: data.button_link?.type || "",
      category_id: data.button_link?.category || null,
      overlay_opacity: +data.overlay_opacity / 100,
      video_source: src,
      ...(data.image[0] ? { image: data.image[0].url } : {}),
      autoplay: data.autoplay,
      muted: data.muted,
      loop: data.loop,
    };
  };

  return BlockDirective;
});
