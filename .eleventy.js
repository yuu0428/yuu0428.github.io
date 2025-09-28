module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/assets": "assets",
    "src/image": "image"
  });

  eleventyConfig.setServerOptions({
    watch: ["src/assets/js/*.js", "src/assets/css/*.css"],
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
