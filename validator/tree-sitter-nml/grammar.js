module.exports = grammar({
  name: "nml",
  rules: {
    source_file: ($) => repeat($.element),
    element: ($) => choice($.self_closing_tag, $.paired_tag),
    self_closing_tag: ($) => seq("<", $.name, repeat($.attribute), "/>"),
    paired_tag: ($) => seq("<", $.name, repeat($.attribute), ">", repeat(choice($.element, $.text)), "</", $.name, ">"),
    attribute: ($) => seq($.name, "=", $.string),
    name: () => /[\p{L}_][\p{L}\p{N}_:-]*/u,
    string: () => /"[^\"]*"/,
    text: () => /[^<]+/,
  },
});
