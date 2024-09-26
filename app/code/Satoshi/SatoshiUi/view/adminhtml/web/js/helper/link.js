define([], function () {
    function Link() {
    }

    var _proto = Link.prototype;
    const LINK_TYPES = [
        'default',
        'category',
        'product',
        'page'
    ];

    _proto.tidyLink = function tidyLink(link) {
        const result = {};

        if (!link) {
            return result;
        }

        const currentLinkType = link['type'];
        const notNeededLinkTypes = LINK_TYPES.filter(linkType => linkType !== currentLinkType);

        Object.entries(link).map(([key, value]) => {
            const isNotNeededLinkType = notNeededLinkTypes.includes(key);

            if (!isNotNeededLinkType) {
                result[key] = value;
            }
        });

        return result;
    }

    return Link;
});
