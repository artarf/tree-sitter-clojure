const symbolStart = /[^0-9#':\s,\\"(){}\[\]@`~^;]/
const symbolRest =        /[^\s,\\"(){}\[\]@`~^;]*/
const symbol = seq(symbolStart, symbolRest)

const namespace = seq(symbol, token.immediate("/"))
const name = seq(optional(namespace), symbol)
const kwName = seq(optional(namespace), symbolRest)

module.exports = grammar({
  name: 'clojure',

  extras: $ => [
    /[\s,]/
  ],

  inlines: $ => [ ],

  rules: {
    document: $ => $._form,

    _form: $ => choice(
      $.metadata,
      $.tagged,
      $.ignored,
      $.special,
      $.function,
      $.list,
      $.set,
      $.nsmap,
      $.map,
      $.vector,
      $.character,
      $.number,
      $.regex,
      $.string,
      $.comment,
      $.keyword,
      $.symbolic,
      $.symbol,
      $.true,
      $.false,
      $.nil
    ),

    comment: $ => seq(';', /[^\n]*/),

    metadata: $ => seq("^" , $._form , $._form),

    special: $ => seq(/(`|'|@|~@?|#')/, $._form),

    ignored: $ => seq('#_', $._form),

    function: $ => seq("#(", repeat($._form), ")"),

    list: $ => seq("(", repeat($._form), ")"),

    set: $ => seq("#{", repeat($._form), "}"),

    map: $ => seq("{", repeat($.pair), "}"),

    nsmap: $ => seq("#:", name, "{", repeat($.pair), "}"),

    pair: $ => seq(
      field("key", $._form),
      field("value", $._form)
    ),

    vector: $ => seq("[", repeat($._form), "]"),

    regex: $ => seq(
        '#"',
        repeat1(choice(
            token.immediate(/[^\\"]+/),
            $.regex_escape_sequence)),
        '"'),

    regex_escape_sequence: $ => token.immediate(seq('\\', /./)),

    string: $ => choice(
      seq('"', '"'),
      seq('"', $.string_content, '"')
    ),

    string_content: $ => repeat1(choice(
      token.immediate(/[^\\"]+/),
      $.escape_sequence
    )),

    escape_sequence: $ => token.immediate(seq(
      '\\',
      /(\"|\\|\/|b|n|r|t|u)/
    )),

    tagged: $ => seq("#", token.immediate(name), $.string),

    character: $ => token(seq('\\',
        choice(
            /./,
            /u[0-9A-F]{4}/, //unicode char
            "newline",
            "space",
            "tab",
            "formfeed",
            "backspace",
            "return"
        ))),

    number: $ => {
      const hex_literal = seq(
        choice('0x', '0X'),
        /[\da-fA-F]+/
      )

      const decimal_digits = /\d+/
      const signed_integer = seq(optional(choice('-','+')), decimal_digits)
      const exponent_part = seq(choice('e', 'E'), signed_integer)

      const octal_literal = seq("0", /[0-7]+/)

      const decimal_integer_literal = seq(
        optional(choice('-','+')),
        choice(
          '0',
          seq(/[1-9]/, optional(decimal_digits))
        )
      )

      const decimal_literal = choice(
        seq(decimal_integer_literal, '.', optional(decimal_digits), optional(exponent_part)),
        seq('0.', decimal_digits, optional(exponent_part)),
        seq(decimal_integer_literal, optional(exponent_part))
      )
      const ratio_literal = seq(decimal_integer_literal, "/", decimal_integer_literal)
      const radix_literal = choice(
        seq(/\d/, "r", decimal_digits),
        seq(/\d\d/, "r", /[\da-zA-Z]+/)
      )

      return token(choice(
        ratio_literal,
        radix_literal,
        hex_literal,
        decimal_literal,
        octal_literal
      ))
    },

    symbolic: $ => token(choice("##NaN", "##Inf", "##-Inf")),

    keyword: $ => token(choice(
        seq("::", kwName),
        seq(":", kwName),
    )),

    symbol: $ => token(name),

    true: $ => "true",

    false: $ => "false",

    nil: $ => "nil",

  }
});

// Symbols begin with a non-numeric character and can contain alphanumeric characters
// and *, +, !, -, _, ', ?, <, > and = (other characters may be allowed eventually).
// function symbol () {
//   return choice(
//             seq(dotSep(symbolre), "/", symbolre),
//             dotSep(symbolre),
//   )
// }
// function symbol () {
//   const name = seq(symbolFirstChar, (repeat))
//   const namespace_part = seq(dotSep(name), "/")
//   return seq(optional(namespace_part), name)
// }

    // CLJ_RE = /// ([\s,]*) # whitespace
    //      ( ~@                         # Unquote-splicing
    //      | \\.[^\s,\\"\[\]{}()@`~^;]* # character literal
    //      | \#[?_\{]                   # start reader conditional, discard or set
    //      | [\[\]{}()'`~^@]            # list delimiters and spcecial chars
    //      | \#?"(?:\\.|[^\\"])*"       # string or regular expression
    //      | ;.*                        # comment
    //      | [^\s,\\"\[\]{}()@`~^;]*    # symbol or tag
    //      )
    //     ///g
