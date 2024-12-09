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
  "Magento_PageBuilder/js/events",
  "underscore",
  "Magento_PageBuilder/js/content-type-menu/hide-show-option",
  "Magento_PageBuilder/js/utils/delay-until",
  "Magento_PageBuilder/js/utils/editor",
  "Magento_PageBuilder/js/wysiwyg/factory",
  "Magento_PageBuilder/js/content-type/preview",
], function (
  _jquery,
  _events,
  _underscore,
  _hideShowOption,
  _delayUntil,
  _editor,
  _factory,
  _preview
) {
  /**
   * Copyright © Magento, Inc. All rights reserved.
   * See COPYING.txt for license details.
   */

  /**
   * @api
   */
  var Preview = /*#__PURE__*/ (function (_preview2) {
    "use strict";

    _inheritsLoose(Preview, _preview2);

    function Preview() {
      var _this;

      for (
        var _len = arguments.length, args = new Array(_len), _key = 0;
        _key < _len;
        _key++
      ) {
        args[_key] = arguments[_key];
      }

      _this = _preview2.call.apply(_preview2, [this].concat(args)) || this;
      _this.wysiwygDeferred = _jquery.Deferred();
      _this.afterRenderDeferred = _jquery.Deferred();
      _this.handledDoubleClick = false;
      return _this;
    }

    var _proto = Preview.prototype;

    /**
     * @returns {Boolean}
     */
    _proto.isWysiwygSupported = function isWysiwygSupported() {
      return (0, _editor.isWysiwygSupported)();
    };
    /**
     * Return an array of options
     *
     * @returns {OptionsInterface}
     */

    _proto.retrieveOptions = function retrieveOptions() {
      var options = _preview2.prototype.retrieveOptions.call(this);

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
     * @param {HTMLElement} element
     */

    _proto.afterRenderWysiwyg = function afterRenderWysiwyg(element) {
      var _this2 = this;

      this.element = element;
      element.id = this.contentType.id + "-editor"; // Set the innerHTML manually so we don't upset Knockout & TinyMCE

      element.innerHTML = this.data.content.html();
      this.contentType.dataStore.subscribe(function () {
        // If we're not focused into TinyMCE inline, update the value when it changes in the data store
        if (
          !_this2.wysiwyg ||
          (_this2.wysiwyg &&
            _this2.wysiwyg.getAdapter().id !==
              (0, _editor.getActiveEditor)().id)
        ) {
          element.innerHTML = _this2.data.content.html();
        }
      }, "content");
      this.afterRenderDeferred.resolve(element);
      /**
       * afterRenderWysiwyg is called whenever Knockout causes a DOM re-render. This occurs frequently within Slider
       * due to Slick's inability to perform a refresh with Knockout managing the DOM. Due to this the original
       * WYSIWYG instance will be detached from this slide and we need to re-initialize on click.
       */

      this.wysiwyg = null;
    };
    /**
     * Stop event to prevent execution of action when editing textarea.
     *
     * @param {Preview} preview
     * @param {JQueryEventObject} event
     * @returns {Boolean}
     */

    _proto.stopEvent = function stopEvent(preview, event) {
      event.stopPropagation();
      return true;
    };
    /**
     * Init WYSIWYG on load
     *
     * @param element
     * @deprecated please use activateEditor & initWysiwygFromClick
     */

    _proto.initWysiwyg = function initWysiwyg(element) {
      this.element = element;
      element.id = this.contentType.id + "-editor";
      this.wysiwyg = null;
      return this.initWysiwygFromClick(true);
    };
    /**
     * Init the WYSIWYG
     *
     * @param {boolean} focus Should wysiwyg focus after initialization?
     * @returns Promise
     */

    _proto.initWysiwygFromClick = function initWysiwygFromClick(focus) {
      var _this3 = this;

      if (focus === void 0) {
        focus = false;
      }

      if (this.wysiwyg) {
        return Promise.resolve(this.wysiwyg);
      }

      var wysiwygConfig =
        this.config.additional_data.wysiwygConfig.wysiwygConfigData;
      wysiwygConfig.adapter.settings.paste_as_text = true;

      if (focus) {
        wysiwygConfig.adapter.settings.auto_focus = this.element.id;

        wysiwygConfig.adapter.settings.init_instance_callback = function () {
          _underscore.defer(function () {
            _this3.element.blur();

            _this3.element.focus();
          });
        };
      }
      wysiwygConfig.adapter.settings.fixed_toolbar_container =
        "#" + this.contentType.id + " .pagebuilder-wygiwyg-text-content";

      return (0, _factory)(
        this.contentType.id,
        this.element.id,
        this.config.name,
        wysiwygConfig,
        this.contentType.dataStore,
        "content",
        this.contentType.stageId
      ).then(function (wysiwyg) {
        _this3.wysiwyg = wysiwyg;
        return wysiwyg;
      });
    };
    /**
     * Makes WYSIWYG active
     *
     * @param {Preview} preview
     * @param {JQueryEventObject} event
     * @returns {Boolean}
     */

    _proto.activateEditor = function activateEditor(preview, event) {
      var _this4 = this;

      if (this.element && !this.wysiwyg) {
        var bookmark = (0, _editor.createBookmark)(event);
        (0, _editor.lockImageSize)(this.element);
        this.element.removeAttribute("contenteditable");

        _underscore.defer(function () {
          _this4
            .initWysiwygFromClick(true)
            .then(function () {
              return (0, _delayUntil)(
                function () {
                  // We no longer need to handle double click once it's initialized
                  _this4.handledDoubleClick = true;

                  _this4.wysiwygDeferred.resolve();

                  (0, _editor.moveToBookmark)(bookmark);
                  (0, _editor.unlockImageSize)(_this4.element);
                },
                function () {
                  return _this4.element.classList.contains("mce-edit-focus");
                },
                10
              );
            })
            .catch(function (error) {
              // If there's an error with init of WYSIWYG editor push into the console to aid support
              console.error(error);
            });
        });
      }
    };
    /**
     * If a user double clicks prior to initializing TinyMCE, forward the event
     *
     * @param preview
     * @param event
     */

    _proto.handleDoubleClick = function handleDoubleClick(preview, event) {
      var _this5 = this;

      if (this.handledDoubleClick) {
        return;
      }

      event.preventDefault();
      var targetIndex = (0, _editor.findNodeIndex)(
        this.element,
        event.target.tagName,
        event.target
      );
      this.handledDoubleClick = true;
      this.wysiwygDeferred.then(function () {
        var target = document.getElementById(event.target.id);

        if (!target) {
          target = (0, _editor.getNodeByIndex)(
            _this5.element,
            event.target.tagName,
            targetIndex
          );
        }

        if (target) {
          target.dispatchEvent((0, _editor.createDoubleClickEvent)());
        }
      });
    };
    /**
     * @param {HTMLTextAreaElement} element
     */

    _proto.initTextarea = function initTextarea(element) {
      var _this6 = this;

      this.textarea = element; // set initial value of textarea based on data store

      this.textarea.value = this.contentType.dataStore.get("content");
      this.adjustTextareaHeightBasedOnScrollHeight(); // Update content in our stage preview textarea after its slideout counterpart gets updated

      _events.on("form:" + this.contentType.id + ":saveAfter", function () {
        _this6.textarea.value = _this6.contentType.dataStore.get("content");

        _this6.adjustTextareaHeightBasedOnScrollHeight();
      });
    };
    /**
     * Save current value of textarea in data store
     */

    _proto.onTextareaKeyUp = function onTextareaKeyUp() {
      this.adjustTextareaHeightBasedOnScrollHeight();
      this.contentType.dataStore.set("content", this.textarea.value);
    };
    /**
     * Start stage interaction on textarea blur
     */

    _proto.onTextareaFocus = function onTextareaFocus() {
      (0, _jquery)(this.textarea)
        .closest(".pagebuilder-wygiwyg-text-content")
        .addClass("pagebuilder-toolbar-active");

      _events.trigger("stage:interactionStart");
    };
    /**
     * Stop stage interaction on textarea blur
     */

    _proto.onTextareaBlur = function onTextareaBlur() {
      (0, _jquery)(this.textarea)
        .closest(".pagebuilder-wygiwyg-text-content")
        .removeClass("pagebuilder-toolbar-active");

      _events.trigger("stage:interactionStop");
    };
    /**
     * Retrieve the margin & padding & alignment styles for the placeholder
     *
     * @returns {any}
     */

    _proto.getPlaceholderStyle = function getPlaceholderStyle() {
      var keys = [
        "marginBottom",
        "marginLeft",
        "marginRight",
        "marginTop",
        "paddingBottom",
        "paddingLeft",
        "paddingRight",
        "paddingTop",
        "textAlign",
      ];
      return _underscore.pick(this.data.content.style(), function (style, key) {
        return keys.indexOf(key) !== -1;
      });
    };
    /**
     * Bind events
     */

    _proto.bindEvents = function bindEvents() {
      var _this7 = this;

      _preview2.prototype.bindEvents.call(this);

      this.contentType.dataStore.subscribe(function (state) {
        var sanitizedContent = (0,
        _editor.replaceDoubleQuoteWithSingleQuoteWithinVariableDirective)(
          (0, _editor.escapeDoubleQuoteWithinWidgetDirective)(state.content)
        );

        if (sanitizedContent !== state.content) {
          state.content = sanitizedContent;
        }
      }); // After drop of new content type open TinyMCE and focus

      _events.on("satoshi_image_with_text:dropAfter", function (args) {
        if (args.id === _this7.contentType.id) {
          _this7.afterRenderDeferred.then(function () {
            if (_this7.isWysiwygSupported()) {
              _this7.initWysiwygFromClick(true);
            }
          });
        }
      });
    };
    /**
     * Adjust textarea's height based on scrollHeight
     */

    _proto.adjustTextareaHeightBasedOnScrollHeight =
      function adjustTextareaHeightBasedOnScrollHeight() {
        this.textarea.style.height = "";
        var scrollHeight = this.textarea.scrollHeight;
        var minHeight = parseInt(
          (0, _jquery)(this.textarea).css("min-height"),
          10
        );

        if (scrollHeight === minHeight) {
          // leave height at 'auto'
          return;
        }

        (0, _jquery)(this.textarea).height(scrollHeight);
      };

    return Preview;
  })(_preview);

  return Preview;
});
//# sourceMappingURL=preview.js.map
