/*eslint-disable */
/* jscs:disable */
define(["underscore", "Magento_PageBuilder/js/utils/object"], function (_underscore, _object) {
    var Array = /*#__PURE__*/function () {
        "use strict";

        function Array() {}

        var _proto = Array.prototype;

        /**
         * Convert value to internal format
         *
         * @param value string
         * @returns {string | object}
         */
        _proto.fromDom = function fromDom(value) {
            if (value && value !== "") {
                return JSON.parse(value);
            }

            return [];
        };

        /**
         * Convert value to knockout format
         *
         * @param name string
         * @param data Object
         * @returns {string | object}
         */
        _proto.toDom = function toDom(name, data) {
            var content = (0, _object.get)(data, name);

            if (_underscore.isString(content) && content !== "") {
                content = JSON.parse(content);
            }

            if (content && Object.keys(content).length) {
                return content;
            }

            return JSON.stringify([]);
        };

        return Array;
    }();

    return Array;
});
//# sourceMappingURL=array.js.map
