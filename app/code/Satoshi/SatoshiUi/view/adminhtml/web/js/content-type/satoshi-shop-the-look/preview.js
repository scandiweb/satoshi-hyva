/*eslint-disable */
/* jscs:disable */

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}

define([
  "jquery",
  "knockout",
  "mage/translate",
  "Magento_PageBuilder/js/events",
  "slick",
  "underscore",
  "Magento_PageBuilder/js/config",
  "Magento_PageBuilder/js/content-type-menu/hide-show-option",
  "Magento_PageBuilder/js/content-type/preview",
], function (
  _jquery,
  _knockout,
  _translate,
  _events,
  _slick,
  _underscore,
  _config,
  _hideShowOption,
  _preview
) {
  /**
   * @api
   */
  var Preview = /*#__PURE__*/ (function (_preview2) {
    "use strict";

    _inheritsLoose(Preview, _preview2);

    /**
     * Define keys which when changed should not trigger the slider to be rebuilt
     *
     * @type {string[]}
     */

    /**
     * @inheritdoc
     */
    function Preview(contentType, config, observableUpdater) {
      var _this;

      _this =
        _preview2.call(this, contentType, config, observableUpdater) || this;
      _this.previewElement = _jquery.Deferred();
      _this.widgetUnsanitizedHtml = _knockout.observable();

      _this.ignoredKeysForBuild = [
        "margins_and_padding",
        "border",
        "border_color",
        "border_radius",
        "border_width",
        "css_classes",
        "text_align",
      ];

      return _this;
    }
    /**
     * Return an array of options
     *
     * @returns {OptionsInterface}
     */

    var _proto = Preview.prototype;

    /**
     * On afterRender callback.
     *
     * @param {Element} element
     */
    _proto.onAfterRender = function onAfterRender(element) {
      this.element = element;
      this.previewElement.resolve(element);
    };

    /**
     * @inheritdoc
     */
    _proto.afterObservablesUpdated = function afterObservablesUpdated() {
      var _this2 = this;

      _preview2.prototype.afterObservablesUpdated.call(this);

      var data = this.contentType.dataStore.getState();

      if (this.hasDataChanged(this.previousData, data)) {
        var url = _config.getConfig("preview_url");

        var requestConfig = {
          // Prevent caching
          method: "POST",
          data: {
            role: this.config.name,
            directive: this.data.main.html(),
          },
        };

        _jquery
          .ajax(url, requestConfig)
          .done(function (response) {
            if (response.data.error) {
              _this2.widgetUnsanitizedHtml(response.data.error);
            } else {
              _this2.widgetUnsanitizedHtml(response.data.content);
            }

            _this2.previewElement.done(function () {
              (0, _jquery)(_this2.element).trigger("contentUpdated");

              _this2.element
                .querySelector(".slider__actions button:first-of-type")
                ?.addEventListener("click", function (e) {
                  e.preventDefault();

                  const slideWidth =
                    _this2.element.querySelector(".slider__slide")?.offsetWidth;
                  const slider =
                    _this2.element.querySelector(".slider__slides");
                  if (slider) {
                    slider.scrollLeft = slider.scrollLeft - slideWidth;
                  }
                });
              _this2.element
                .querySelector(".slider__actions button:last-of-type")
                ?.addEventListener("click", function (e) {
                  e.preventDefault();
                  const slideWidth =
                    _this2.element.querySelector(".slider__slide")?.offsetWidth;
                  const slider =
                    _this2.element.querySelector(".slider__slides");
                  if (slider) {
                    slider.scrollLeft = slider.scrollLeft + slideWidth;
                  }
                });

              _this2.element
                .querySelectorAll(".position-btn")
                .forEach((button) => {
                  button.addEventListener("click", function (e) {
                    e.preventDefault();
                    const btn = e.currentTarget;
                    const index = btn?.getAttribute("data-index");

                    const slideWidth =
                      _this2.element.querySelector(
                        ".slider__slide"
                      )?.offsetWidth;
                    const slider =
                      _this2.element.querySelector(".slider__slides");
                    if (slider) {
                      slider.scrollLeft = (+index - 1) * (slideWidth + 16);
                    }
                  });
                });
            });
          })
          .fail(function () {});
      }

      this.previousData = Object.assign({}, data);
    };

    /**
     * Build the slick config object
     *
     * @returns {{autoplay: boolean; autoplay: number; infinite: boolean; arrows: boolean; dots: boolean;
     * centerMode: boolean; slidesToScroll: number; slidesToShow: number;}}
     */

    /**
     * Determine if the data has changed, whilst ignoring certain keys which don't require a rebuild
     *
     * @param {DataObject} previousData
     * @param {DataObject} newData
     * @returns {boolean}
     */
    _proto.hasDataChanged = function hasDataChanged(previousData, newData) {
      previousData = _underscore.omit(previousData, this.ignoredKeysForBuild);
      newData = _underscore.omit(newData, this.ignoredKeysForBuild);
      return !_underscore.isEqual(previousData, newData);
    };

    return Preview;
  })(_preview);

  return Preview;
});
//# sourceMappingURL=preview.js.map
