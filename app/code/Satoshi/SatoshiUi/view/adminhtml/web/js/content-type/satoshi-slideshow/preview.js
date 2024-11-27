/*eslint-disable */
/* jscs:disable */

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}

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
  "Magento_PageBuilder/js/binding/focus",
  "Magento_PageBuilder/js/config",
  "Magento_PageBuilder/js/content-type-factory",
  "Magento_PageBuilder/js/content-type-menu/hide-show-option",
  "Magento_PageBuilder/js/content-type-menu/option",
  "Magento_PageBuilder/js/utils/delay-until",
  "Magento_PageBuilder/js/utils/promise-deferred",
  "Magento_PageBuilder/js/content-type/preview-collection",
], function (
  _jquery,
  _knockout,
  _translate,
  _events,
  _slick,
  _underscore,
  _focus,
  _config,
  _contentTypeFactory,
  _hideShowOption,
  _option,
  _delayUntil,
  _promiseDeferred,
  _previewCollection
) {
  /**
   * Copyright © Magento, Inc. All rights reserved.
   * See COPYING.txt for license details.
   */

  /**
   * @api
   */
  var Preview = /*#__PURE__*/ (function (_previewCollection2) {
    "use strict";

    _inheritsLoose(Preview, _previewCollection2);

    /**
     * Define keys which when changed should not trigger the slider to be rebuilt
     *
     * @type {string[]}
     */

    /**
     * @param {ContentTypeCollectionInterface} contentType
     * @param {ContentTypeConfigInterface} config
     * @param {ObservableUpdater} observableUpdater
     */
    function Preview(contentType, config, observableUpdater) {
      var _this;

      _this =
        _previewCollection2.call(
          this,
          contentType,
          config,
          observableUpdater
        ) || this; // Wait for the tabs instance to mount and the container to be ready

      _this.focusedSlide = _knockout.observable();
      _this.activeSlide = _knockout.observable(0);
      _this.events = {
        columnWidthChangeAfter: "onColumnResize",
      };
      _this.ready = false;
      _this.mountAfterDeferred = (0, _promiseDeferred)();
      _this.afterChildrenRenderDeferred = (0, _promiseDeferred)();
      _this.buildSlickDebounce = _underscore.debounce(
        _this.buildSlick.bind(_assertThisInitialized(_this)),
        10
      );
      _this.ignoredKeysForBuild = [
        "display",
        "margins_and_padding",
        "border",
        "border_color",
        "border_radius",
        "border_width",
        "css_classes",
        "name",
        "text_align",
      ];
      Promise.all([
        _this.afterChildrenRenderDeferred.promise,
        _this.mountAfterDeferred.promise,
      ]).then(function (_ref) {
        var element = _ref[0],
          expectedChildren = _ref[1];
        // We always create 1 tab when dropping tabs into the instance
        expectedChildren = expectedChildren || 1; // Wait until all children's DOM elements are present before building the tabs instance

        (0, _delayUntil)(
          function () {
            _this.element = element;
            _this.childSubscribe = _this.contentType.children.subscribe(
              _this.buildSlickDebounce
            );
            _this.previousData = _this.contentType.dataStore.getState();

            _this.contentType.dataStore.subscribe(function (data) {
              if (_this.hasDataChanged(_this.previousData, data)) {
                _this.buildSlickDebounce();
              }

              _this.previousData = data;
            });

            _this.buildSlick(); // Redraw slide after content type gets redrawn

            _events.on("contentType:redrawAfter", function (args) {
              var $element = (0, _jquery)(_this.element);

              if (
                args.element &&
                _this.element &&
                $element.closest(args.element).length
              ) {
                $element.slick("setPosition");
              }
            }); // Set the stage to interacting when a slide is focused

            _this.focusedSlideSubscriber = _this.focusedSlide.subscribe(
              function (value) {
                if (value !== null) {
                  _events.trigger("stage:interactionStart");
                } else {
                  _events.trigger("stage:interactionStop");
                }
              }
            );

            _events.on(
              "stage:" +
                _this.contentType.stageId +
                ":fullScreenModeChangeAfter",
              _this.onColumnResize.bind(_assertThisInitialized(_this), [true])
            );

            _events.on(
              "stage:" + _this.contentType.stageId + ":viewportChangeAfter",
              function () {
                if (_this.element) {
                  (0, _jquery)(_this.element).slick("setPosition");

                  _this.checkWidth();
                }
              }
            );
          },
          function () {
            return (
              (0, _jquery)(element).find(".pagebuilder-slide").length ===
              expectedChildren
            );
          }
        );
      });
      return _this;
    }
    /**
     * Return an array of options
     *
     * @returns {OptionsInterface}
     */

    var _proto = Preview.prototype;

    _proto.retrieveOptions = function retrieveOptions() {
      var options = _previewCollection2.prototype.retrieveOptions.call(this);

      options.add = new _option({
        preview: this,
        icon: "<i class='icon-pagebuilder-add'></i>",
        title: (0, _translate)("Add"),
        action: this.addSlide,
        classes: ["add-child"],
        sort: 10,
      });
      options.hideShow = new _hideShowOption({
        preview: this,
        icon: _hideShowOption.showIcon,
        title: _hideShowOption.showText,
        action: this.onOptionVisibilityToggle,
        classes: ["hide-show-content-type"],
        sort: 40,
      });
      return options;
    };
    /**
     * Set an active slide for navigation dot
     *
     * @param slideIndex
     */

    _proto.setActiveSlide = function setActiveSlide(slideIndex) {
      this.activeSlide(slideIndex);
    };
    /**
     * Set the focused slide
     *
     * @param {number} slideIndex
     * @param {boolean} force
     */

    _proto.setFocusedSlide = function setFocusedSlide(slideIndex, force) {
      if (force === void 0) {
        force = false;
      }

      if (force) {
        this.focusedSlide(null);
      }

      this.focusedSlide(slideIndex);
    };
    /**
     * Unset focused slide on focusout event.
     *
     * @param {PreviewCollection} data
     * @param {JQueryEventObject} event
     */

    _proto.onFocusOut = function onFocusOut(data, event) {
      var relatedTarget = event.relatedTarget;

      if (
        !relatedTarget &&
        document.activeElement &&
        !(document.activeElement instanceof HTMLBodyElement)
      ) {
        relatedTarget = document.activeElement;
      }

      if (!relatedTarget) {
        this.setFocusedSlide(null);
        return;
      }

      var $relatedTarget = (0, _jquery)(relatedTarget);
      var isRelatedTargetDescendantOfNavigation = $relatedTarget.closest(
        this.navigationElement
      ).length;
      var isFocusedOnAnotherSlideInThisSlider =
        $relatedTarget.hasClass("navigation-dot-anchor") &&
        isRelatedTargetDescendantOfNavigation;

      if (isFocusedOnAnotherSlideInThisSlider) {
        _events.trigger("stage:interactionStop");
      } else if (!isRelatedTargetDescendantOfNavigation) {
        this.setFocusedSlide(null);
      }
    };
    /**
     * Set reference to navigation element in template
     *
     * @param {HTMLElement} navigationElement
     */

    _proto.afterNavigationRender = function afterNavigationRender(
      navigationElement
    ) {
      this.navigationElement = navigationElement;
    };
    /**
     * Navigate to a slide
     *
     * @param {number} slideIndex
     * @param {boolean} dontAnimate
     * @param {boolean} force
     */

    _proto.navigateToSlide = function navigateToSlide(
      slideIndex,
      dontAnimate,
      force
    ) {
      if (dontAnimate === void 0) {
        dontAnimate = false;
      }

      if (force === void 0) {
        force = false;
      }

      if ((0, _jquery)(this.element).hasClass("slick-initialized")) {
        (0, _jquery)(this.element).slick("slickGoTo", slideIndex, dontAnimate);
        this.setActiveSlide(slideIndex);
        this.setFocusedSlide(slideIndex, force);
      }
    };
    /**
     * After child render record element
     *
     * @param {HTMLElement} element
     */

    _proto.afterChildrenRender = function afterChildrenRender(element) {
      this.element = element; // if slider has been re-rendered previously on this element, re-build

      if (this.ready) {
        this.buildSlick();
      }

      _previewCollection2.prototype.afterChildrenRender.call(this, element);

      this.afterChildrenRenderDeferred.resolve(element);
    };
    /**
     * On sort start force the container height, also focus to that slide
     *
     * @param {Event} event
     * @param {JQueryUI.SortableUIParams} params
     */

    _proto.onSortStart = function onSortStart(event, params) {
      this.forceContainerHeight();

      if (
        this.activeSlide() !== params.item.index() ||
        this.focusedSlide() !== params.item.index()
      ) {
        this.navigateToSlide(params.item.index(), false, true); // As we've completed a navigation request we need to ensure we don't remove the forced height

        this.contentTypeHeightReset = true;
      }
    };
    /**
     * On sort stop ensure the focused slide and the active slide are in sync, as the focus can be lost in this
     * operation
     */

    _proto.onSortStop = function onSortStop(event, params) {
      var _this2 = this;

      if (this.activeSlide() !== this.focusedSlide()) {
        this.setFocusedSlide(this.activeSlide(), true);
      }

      if (params.item.index() !== -1) {
        _underscore.defer(
          this.focusElement.bind(this, event, params.item.index())
        );
      }

      _underscore.defer(function () {
        (0, _jquery)(_this2.element).css({
          height: "",
          overflow: "",
        });
      });
    };
    /**
     * Add a slide into the slider
     */

    _proto.addSlide = function addSlide() {
      var _this3 = this;

      (0, _contentTypeFactory)(
        _config.getConfig("content_types").slide,
        this.contentType,
        this.contentType.stageId
      ).then(function (slide) {
        _events.on(
          "slide:mountAfter",
          function (args) {
            if (args.id === slide.id) {
              _underscore.defer(function () {
                // Wait until slick is initialized before trying to navigate
                (0, _delayUntil)(
                  function () {
                    return _this3.navigateToSlide(
                      _this3.contentType.children().length - 1
                    );
                  },
                  function () {
                    return (0, _jquery)(_this3.element).hasClass(
                      "slick-initialized"
                    );
                  },
                  10
                );
              });

              _events.off("slide:" + slide.id + ":mountAfter");
            }
          },
          "slide:" + slide.id + ":mountAfter"
        );

        _this3.contentType.addChild(
          slide,
          _this3.contentType.children().length
        );
      });
    };
    /**
     * Slider can not receive drops by default
     *
     * @returns {boolean}
     */

    _proto.isContainer = function isContainer() {
      return false;
    };
    /**
     * Slider navigation click handler.
     *
     * @param {number} index
     * @param {Preview} context
     * @param {Event} event
     */

    _proto.onControlClick = function onControlClick(index, context, event) {
      (0, _jquery)(event.target).focus();
      this.navigateToSlide(index);
      this.setFocusedSlide(index);
    };
    /**
     * @inheritdoc
     */

    _proto.destroy = function destroy() {
      _previewCollection2.prototype.destroy.call(this);

      if (this.focusedSlideSubscriber) {
        this.focusedSlideSubscriber.dispose();
      }
    };
    /**
     * Bind events
     */

    _proto.bindEvents = function bindEvents() {
      var _this4 = this;

      _previewCollection2.prototype.bindEvents.call(this);

      _events.on("satoshi_slideshow:mountAfter", function (args) {
        if (args.id === _this4.contentType.id) {
          if (args.expectChildren !== undefined) {
            _this4.mountAfterDeferred.resolve(args.expectChildren);
          }
        }
      }); // Set the active slide to the new position of the sorted slide

      _events.on("childContentType:sortUpdate", function (args) {
        if (args.instance.id === _this4.contentType.id) {
          (0, _jquery)(args.ui.item).remove(); // Remove the item as the container's children is controlled by knockout

          _this4.setActiveSlide(args.newPosition);

          _underscore.defer(
            _this4.focusElement.bind(_this4, args.event, args.newPosition)
          );
        }
      }); // When a slide content type is removed
      // we need to force update the content of the slider due to KO rendering issues

      var newItemIndex;

      _events.on("slide:removeAfter", function (args) {
        if (
          args.parentContentType &&
          args.parentContentType.id === _this4.contentType.id
        ) {
          // Mark the previous slide as active
          newItemIndex = args.index - 1 >= 0 ? args.index - 1 : 0;

          _this4.forceContainerHeight();

          var data = _this4.contentType.children().slice(0);

          _this4.contentType.children([]);

          _this4.contentType.children(data);

          _underscore.defer(function () {
            _this4.buildSlick();
          });
        }
      });

      _events.on("slide:renderAfter", function (args) {
        var itemIndex = args.contentType.parentContentType
          .getChildren()()
          .indexOf(args.contentType);

        if (
          args.contentType.parentContentType.id === _this4.contentType.id &&
          newItemIndex !== null &&
          newItemIndex === itemIndex
        ) {
          _underscore.defer(function () {
            if (newItemIndex !== null) {
              newItemIndex = null;

              _this4.navigateToSlide(itemIndex, true, true);

              _underscore.defer(function () {
                _this4.focusedSlide(null);

                _this4.focusedSlide(itemIndex);
              });
            }
          });
        }
      }); // On a slide content types creation we need to lock the height of the slider to ensure a smooth transition

      _events.on("slide:createAfter", function (args) {
        if (
          _this4.element &&
          _this4.ready &&
          args.contentType.parentContentType.id === _this4.contentType.id
        ) {
          _this4.forceContainerHeight();

          _underscore.defer(function () {
            (0, _jquery)(_this4.element).css({
              height: "",
              overflow: "",
            });
          });
        }
      }); // ContentType being mounted onto container

      _events.on("satoshi_slideshow:dropAfter", function (args) {
        if (
          args.id === _this4.contentType.id &&
          _this4.contentType.children().length === 0
        ) {
          _this4.addSlide();
        }
      }); // Capture when a content type is duplicated within the container

      var duplicatedSlide;
      var duplicatedSlideIndex;

      _events.on("slide:duplicateAfter", function (args) {
        if (
          args.duplicateContentType.parentContentType.id ===
            _this4.contentType.id &&
          args.direct
        ) {
          duplicatedSlide = args.duplicateContentType;
          duplicatedSlideIndex = args.index;
        }
      });

      _events.on("slide:mountAfter", function (args) {
        if (duplicatedSlide && args.id === duplicatedSlide.id) {
          _underscore.defer(function () {
            // Mark the new duplicate slide as active
            _this4.navigateToSlide(duplicatedSlideIndex, true, true);

            duplicatedSlide = duplicatedSlideIndex = null;
          });
        }
      });
    };
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
    /**
     * Build our instance of slick
     */

    _proto.buildSlick = function buildSlick() {
      var _this5 = this;

      if (this.element && this.element.children.length > 0) {
        try {
          (0, _jquery)(this.element).slick("unslick");
        } catch (e) {
          // We aren't concerned if this fails, slick throws an Exception when we cannot unslick
        } // Dispose current subscription in order to prevent infinite loop

        if (this.childSubscribe) {
          this.childSubscribe.dispose();
        } // Force an update on all children, ko tries to intelligently re-render but fails

        var data = this.contentType.children().slice(0);
        this.contentType.children([]);
        (0, _jquery)(this.element).empty();
        this.contentType.children(data); // Re-subscribe original event

        this.childSubscribe = this.contentType.children.subscribe(
          this.buildSlickDebounce
        ); // Bind our init event for slick

        (0, _jquery)(this.element).on("init", function () {
          _this5.ready = true;
        }); // Build slick

        (0, _jquery)(this.element).slick(
          Object.assign(
            {
              initialSlide: this.activeSlide() || 0,
            },
            this.buildSlickConfig()
          )
        ); // Update our KO pointer to the active slide on change

        (0, _jquery)(this.element)
          .on("beforeChange", function (event, slick, currentSlide, nextSlide) {
            (0, _jquery)(_this5.element).css("pointer-events", "none");

            _this5.setActiveSlide(nextSlide);
          })
          .on("afterChange", function () {
            if (!_this5.contentTypeHeightReset) {
              (0, _jquery)(_this5.element).css({
                height: "",
                overflow: "",
              });
              _this5.contentTypeHeightReset = null;
            }

            (0, _jquery)(_this5.element).css("pointer-events", "");
          });
      }
    };
    /**
     * Take dropped element on focus.
     *
     * @param {JQueryEventObject} event
     * @param {number} index
     */

    _proto.focusElement = function focusElement(event, index) {
      var handleClassName = (0, _jquery)(event.target).data("ui-sortable")
        .options.handle;
      (0, _jquery)(
        (0, _jquery)(event.target).find(handleClassName)[index]
      ).focus();
    };
    /**
     * To ensure smooth animations we need to lock the container height
     */

    _proto.forceContainerHeight = function forceContainerHeight() {
      (0, _jquery)(this.element).css({
        height: (0, _jquery)(this.element).outerHeight(),
        overflow: "hidden",
      });
    };
    /**
     * Build the slick config object
     *
     * @returns {{autoplay: boolean; autoplaySpeed: (any | number);
     * fade: boolean; infinite: boolean; arrows: boolean; dots: boolean}}
     */

    _proto.buildSlickConfig = function buildSlickConfig() {
      var data = this.contentType.dataStore.getState();
      return {
        arrows: data.show_arrows === "true",
        autoplay: data.autoplay === "true",
        autoplaySpeed: data.autoplay_speed,
        dots: false,
        // We have our own dots implemented
        fade: data.fade === "true",
        infinite: data.is_infinite === "true",
        waitForAnimate: false,
        swipe: false,
      };
    };
    /**
     * Fit slider in column container
     *
     * @param params
     */

    _proto.onColumnResize = function onColumnResize(params) {
      var _this6 = this;

      setTimeout(function () {
        if (_this6.element) {
          (0, _jquery)(_this6.element).slick("setPosition");

          _this6.checkWidth();
        }
      }, 450);
    };
    /**
     * Check width and add class that marks element as small
     */

    _proto.checkWidth = function checkWidth() {
      if (this.element.offsetWidth < 410) {
        this.element.classList.add("slider-small-width");
      } else {
        this.element.classList.remove("slider-small-width");
      }
    };

    return Preview;
  })(_previewCollection);

  return Preview;
});
//# sourceMappingURL=preview.js.map
