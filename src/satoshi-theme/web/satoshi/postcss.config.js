module.exports = {
    plugins: [
        require("postcss-import"),
        require("tailwindcss/nesting"),
        require("tailwindcss"),
        require("postcss-preset-env"),
    ],
};
