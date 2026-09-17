import type { Action, EditorLanguage, EngineId, OptionValue, ToolId } from "@formatbase/tool-core";

export type ToolOption = {
  id: string;
  label: string;
  type: "select" | "checkbox";
  defaultValue: OptionValue;
  choices?: { label: string; value: OptionValue }[];
  actions?: Action[];
};

export type Tool = {
  id: ToolId;
  slug: ToolId;
  name: string;
  eyebrow: string;
  description: string;
  category: string;
  engine: EngineId;
  operations: Action[];
  action: Action;
  input: { language: EditorLanguage; extensions: string[] };
  output: { language: EditorLanguage; extension: string };
  options: ToolOption[];
  privacy: "local";
  worker: string;
  inputLabel: string;
  outputLabel: string;
  buttonLabel: string;
  seo: { title: string; description: string };
  about: string;
  howItWorks: string[];
  commonErrors: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
  relatedTools: ToolId[];
  example: string;
};

const example = '{"project":"formatbase","version":1,"features":["private","fast","precise"],"active":true}';
const jsonErrors = [
  { title: "Trailing comma", description: "A comma after the final object property or array item is invalid in strict JSON." },
  { title: "Single quotes", description: "JSON strings and property names require double quotes." },
  { title: "Missing separator", description: "Every property and array item needs a comma before the next one." }
];
const indentation: ToolOption = { id: "indentation", label: "Indent", type: "select", defaultValue: 2, choices: [{ label: "2 spaces", value: 2 }, { label: "4 spaces", value: 4 }, { label: "Tab", value: "tab" }], actions: ["format", "sort"] };
function jsonTool(tool: Omit<Tool, "category" | "engine" | "operations" | "input" | "output" | "options" | "privacy" | "worker" | "commonErrors"> & { commonErrors?: Tool["commonErrors"] }): Tool {
  return { ...tool, category: "json", engine: "json", operations: [tool.action], input: { language: "json", extensions: [".json"] }, output: { language: "json", extension: ".json" }, options: [indentation], commonErrors: tool.commonErrors ?? jsonErrors, privacy: "local", worker: "tool-worker" };
}

const sqlOptions: ToolOption[] = [
  { id: "dialect", label: "Dialect", type: "select", defaultValue: "sql", choices: [
    { label: "Standard SQL", value: "sql" }, { label: "PostgreSQL", value: "postgresql" }, { label: "MySQL", value: "mysql" },
    { label: "MariaDB", value: "mariadb" }, { label: "SQL Server", value: "transactsql" }, { label: "SQLite", value: "sqlite" },
    { label: "BigQuery", value: "bigquery" }, { label: "Snowflake", value: "snowflake" }, { label: "Oracle PL/SQL", value: "plsql" },
    { label: "Redshift", value: "redshift" }, { label: "DuckDB", value: "duckdb" }, { label: "ClickHouse", value: "clickhouse" }
  ] },
  indentation,
  { id: "keywordCase", label: "Keywords", type: "select", defaultValue: "upper", choices: [{ label: "Uppercase", value: "upper" }, { label: "Lowercase", value: "lower" }, { label: "Preserve", value: "preserve" }] },
  { id: "linesBetweenQueries", label: "Query spacing", type: "select", defaultValue: 1, choices: [{ label: "1 line", value: 1 }, { label: "2 lines", value: 2 }, { label: "3 lines", value: 3 }] }
];

const yamlOptions: ToolOption[] = [indentation];
const yamlErrors = [
  { title: "Indentation", description: "YAML structure depends on spaces and indentation level; a misplaced space can change the document." },
  { title: "Aliases and merges", description: "Aliases and merge keys are supported within explicit safety limits." },
  { title: "Multiple documents", description: "A YAML stream may contain documents separated by --- markers, up to the tool's safety limit." }
];
function yamlTool(tool: Omit<Tool, "category" | "engine" | "operations" | "input" | "output" | "options" | "privacy" | "worker" | "commonErrors"> & { commonErrors?: Tool["commonErrors"] }): Tool {
  return { ...tool, category: "yaml", engine: "yaml", operations: [tool.action], input: { language: "yaml", extensions: [".yaml", ".yml"] }, output: { language: "yaml", extension: ".yaml" }, options: yamlOptions, commonErrors: tool.commonErrors ?? yamlErrors, privacy: "local", worker: "tool-worker" };
}
const xmlErrors = [
  { title: "Unclosed tag", description: "Every opening element needs a matching closing tag, unless it is self-closing." },
  { title: "DOCTYPE or entity", description: "DOCTYPE declarations and custom entities are blocked. Use standard XML entities only." },
  { title: "Mixed content", description: "Whitespace around inline text and child elements can be meaningful, so the formatter leaves mixed content unchanged." }
];
function xmlTool(tool: Omit<Tool, "category" | "engine" | "operations" | "input" | "output" | "options" | "privacy" | "worker" | "commonErrors"> & { commonErrors?: Tool["commonErrors"] }): Tool {
  return { ...tool, category: "xml", engine: "xml", operations: [tool.action], input: { language: "xml", extensions: [".xml"] }, output: { language: "xml", extension: ".xml" }, options: [indentation], commonErrors: tool.commonErrors ?? xmlErrors, privacy: "local", worker: "tool-worker" };
}
function converter(config: {
  id: string; name: string; description: string; input: "json" | "yaml" | "xml" | "csv"; output: "json" | "yaml" | "xml" | "csv";
  category: "converters" | "csv"; defaultMode: "lossless" | "best-effort"; about: string; example: string; relatedTools: string[];
  commonErrors: { title: string; description: string }[]; faq: { question: string; answer: string }[];
}): Tool {
  const { id, name, description, input, output, category, defaultMode, about, example, relatedTools, commonErrors, faq } = config;
  return {
    id, slug: id, name, eyebrow: "CONVERT DATA", category, engine: "conversion", operations: ["convert"], action: "convert",
    description, input: { language: input, extensions: input === "yaml" ? [".yaml", ".yml"] : [`.${input}`] }, output: { language: output, extension: `.${output}` },
    options: [{ id: "mode", label: "Mode", type: "select", defaultValue: defaultMode, choices: [{ label: "Lossless", value: "lossless" }, { label: "Best effort", value: "best-effort" }, { label: "Compatibility", value: "compatibility" }] }],
    privacy: "local", worker: "tool-worker", inputLabel: `Input ${input.toUpperCase()}`, outputLabel: `Output ${output.toUpperCase()}`, buttonLabel: `Convert to ${output.toUpperCase()}`,
    seo: { title: `${name} Online | Formatbase`, description: `${description} Processed privately in your browser, with clear warnings for mapping loss.` },
    about, howItWorks: [`Paste ${input.toUpperCase()} or open a file.`, "Choose Lossless, Best effort, or Compatibility mode.", "Convert, review warnings, then copy or download the result."],
    commonErrors, faq, relatedTools, example
  };
}

export const tools: Tool[] = [
  jsonTool({
    id: "json-formatter", slug: "json-formatter", name: "JSON Formatter", eyebrow: "FORMAT & READ", action: "format",
    description: "Turn dense JSON into clean, readable structure. Precise numbers and every key stay intact.",
    inputLabel: "Input JSON", outputLabel: "Formatted JSON", buttonLabel: "Format JSON",
    seo: { title: "JSON Formatter & Validator Online | Formatbase", description: "Format JSON in your browser with precise numbers, duplicate key warnings, and clear errors. No upload required." },
    about: "A JSON formatter adds consistent spacing and indentation so nested data is easier to inspect. Formatbase processes your input in a browser worker, preserving large numeric literals and duplicate keys rather than converting through ordinary JavaScript objects.",
    howItWorks: ["Paste JSON or open a .json file.", "Choose two spaces, four spaces, or tabs.", "Format, inspect warnings, then copy or download the result."],
    faq: [
      { question: "Does my JSON leave my browser?", answer: "No. Formatting runs in a browser worker. This site does not send your input to a server." },
      { question: "Will large integers change?", answer: "No. The formatter keeps numeric text from the parsed JSON syntax instead of converting it to JavaScript numbers." },
      { question: "What happens to duplicate keys?", answer: "Both keys remain in the output, and a warning points out the duplicate." }
    ],
    relatedTools: ["json-validator", "json-minifier", "json-sorter"], example
  }),
  jsonTool({
    id: "json-validator", slug: "json-validator", name: "JSON Validator", eyebrow: "CHECK SYNTAX", action: "validate",
    description: "Find syntax mistakes and duplicate keys with line and column details.",
    inputLabel: "Input JSON", outputLabel: "Validation result", buttonLabel: "Validate JSON",
    seo: { title: "JSON Validator Online | Formatbase", description: "Validate JSON privately in your browser. See accurate syntax errors and duplicate key warnings." },
    about: "JSON validation checks whether text follows strict JSON syntax. It catches missing commas, invalid quotes, trailing commas, and other structural errors before the data reaches an API or application.",
    howItWorks: ["Paste or upload JSON.", "Run validation.", "Use the line and column details to fix errors."],
    faq: [
      { question: "Does validation change my input?", answer: "No. It only analyzes the text and reports errors or warnings." },
      { question: "Are trailing commas valid JSON?", answer: "No. Strict JSON does not allow a comma after the final item in an object or array." }
    ],
    commonErrors: [
      { title: "Trailing comma", description: "A comma after the final object property or array item is invalid in strict JSON." },
      { title: "Invalid string quotes", description: "JSON property names and string values must use double quotes, not single quotes." },
      { title: "Unescaped control character", description: "Line breaks, tabs, and other control characters inside strings must be escaped." }
    ],
    relatedTools: ["json-formatter", "json-minifier", "json-sorter"], example: '{"ok":true,"items":[1,2,3]}'
  }),
  jsonTool({
    id: "json-minifier", slug: "json-minifier", name: "JSON Minifier", eyebrow: "REMOVE WHITESPACE", action: "minify",
    description: "Remove unnecessary whitespace while preserving numbers and keys exactly.",
    inputLabel: "Input JSON", outputLabel: "Minified JSON", buttonLabel: "Minify JSON",
    seo: { title: "JSON Minifier Online | Formatbase", description: "Minify JSON locally in your browser without changing large numeric values or dropping duplicate keys." },
    about: "Minification removes spaces and line breaks that JSON parsers do not need. The result is easier to paste into compact fields or transfer as text.",
    howItWorks: ["Paste or upload valid JSON.", "Select Minify JSON.", "Copy or download the compact result."],
    faq: [
      { question: "Does minification change JSON values?", answer: "It changes whitespace between tokens, while preserving numeric literals and the original key sequence." },
      { question: "Can it fix invalid JSON?", answer: "No. Invalid syntax is reported so you can correct the source." }
    ],
    commonErrors: [
      { title: "Comments in JSON", description: "JavaScript-style comments are not valid JSON and must be removed before minifying." },
      { title: "Dangling comma", description: "A comma before a closing bracket or brace prevents compact output." },
      { title: "Invalid number", description: "Leading zeros and incomplete decimals are rejected by strict JSON parsing." }
    ],
    relatedTools: ["json-formatter", "json-validator", "json-sorter"], example: '{"endpoint":"/api/users","cache":false,"limit":25}'
  }),
  jsonTool({
    id: "json-sorter", slug: "json-sorter", name: "JSON Key Sorter", eyebrow: "ORGANIZE KEYS", action: "sort",
    description: "Sort object keys alphabetically at every level without changing numeric precision.",
    inputLabel: "Input JSON", outputLabel: "Sorted JSON", buttonLabel: "Sort JSON Keys",
    seo: { title: "JSON Key Sorter Online | Formatbase", description: "Sort JSON object keys alphabetically in your browser, with precise number handling and duplicate key warnings." },
    about: "Sorting keys makes objects easier to scan and compare. Arrays keep their original order, while object properties are sorted alphabetically at every nested level.",
    howItWorks: ["Paste or upload JSON.", "Choose indentation.", "Sort keys and copy the result."],
    faq: [
      { question: "Are arrays reordered?", answer: "No. Only object properties are sorted; array items keep their order." },
      { question: "What if an object has duplicate keys?", answer: "Duplicate keys remain in the output and are reported as warnings." }
    ],
    commonErrors: [
      { title: "Duplicate names", description: "Duplicate keys are kept and reported because sorting cannot decide which value should win." },
      { title: "Mixed array items", description: "Arrays preserve their existing order even when objects inside the array have sorted keys." },
      { title: "Invalid source JSON", description: "Syntax errors must be fixed before object keys can be sorted safely." }
    ],
    relatedTools: ["json-formatter", "json-validator", "json-minifier"], example: '{"z":1,"a":{"b":2,"a":1},"items":[{"y":2,"x":1}]}'
  }),
  {
    id: "sql-formatter", slug: "sql-formatter", name: "SQL Formatter", eyebrow: "FORMAT QUERIES", category: "sql", engine: "sql", operations: ["format"], action: "format",
    description: "Make SQL queries readable across twelve dialects, with control over casing and indentation.",
    input: { language: "sql", extensions: [".sql", ".txt"] }, output: { language: "sql", extension: ".sql" }, options: sqlOptions, privacy: "local", worker: "tool-worker",
    inputLabel: "Input SQL", outputLabel: "Formatted SQL", buttonLabel: "Format SQL",
    seo: { title: "SQL Formatter Online — 12 Dialects | Formatbase", description: "Format SQL locally in your browser. Choose PostgreSQL, MySQL, SQL Server, BigQuery, Snowflake, SQLite, and more." },
    about: "SQL Formatter arranges query clauses and expressions for easier review. Choose the dialect that matches your database before formatting. The tool changes whitespace and optional keyword case; it does not validate whether a query is semantically correct or execute it.",
    howItWorks: ["Paste a query or open a .sql file.", "Choose the database dialect and formatting options.", "Format, review the output, then copy or download it."],
    commonErrors: [
      { title: "Wrong dialect", description: "Vendor-specific quoting or functions may fail under Standard SQL. Select the matching database dialect." },
      { title: "Incomplete statement", description: "Unclosed quotes, parentheses, or comments can prevent formatting." },
      { title: "Template syntax", description: "Query templates may need preprocessing because they are not always valid SQL." }
    ],
    faq: [
      { question: "Does this execute my SQL?", answer: "No. The query is formatted locally in your browser and never sent to a database." },
      { question: "Which dialect should I choose?", answer: "Select the dialect of the database that will run the query. Vendor-specific syntax can produce errors under another dialect." },
      { question: "Does formatting prove the query is valid?", answer: "No. Formatting does not check tables, columns, permissions, or database semantics." }
    ],
    relatedTools: [], example: "select u.id, u.email from users u where u.active = true order by u.id desc;"
  },
  yamlTool({
    id: "yaml-formatter", slug: "yaml-formatter", name: "YAML Formatter", eyebrow: "FORMAT CONFIG", action: "format",
    description: "Format YAML documents locally with bounded alias, merge, and nesting limits.",
    inputLabel: "Input YAML", outputLabel: "Formatted YAML", buttonLabel: "Format YAML",
    seo: { title: "YAML Formatter Online | Formatbase", description: "Format YAML locally in your browser with explicit parser safety limits and clear syntax errors." },
    about: "YAML Formatter parses and rewrites YAML with consistent indentation. It supports streams, aliases, and merge keys within safety limits. It preserves anchor names and numeric scalar text, but removes comments, so review the result before replacing a source file.",
    howItWorks: ["Paste YAML or open a .yaml or .yml file.", "Choose indentation and format.", "Review the rewritten result before copying or downloading."],
    faq: [
      { question: "Does my YAML leave the browser?", answer: "No. Parsing runs in a browser worker and the site does not upload the input." },
      { question: "Are comments and anchors preserved?", answer: "Anchor names remain in the formatted text, but comments are removed. Review the output before replacing your source." },
      { question: "How are large aliases handled?", answer: "Depth, alias count, merge keys, and materialized node counts have explicit limits." }
    ], relatedTools: ["yaml-validator"], example: "service:\n  name: api\n  ports: [8080, 8081]"
  }),
  yamlTool({
    id: "yaml-validator", slug: "yaml-validator", name: "YAML Validator", eyebrow: "CHECK YAML", action: "validate",
    description: "Check YAML syntax and safety limits with line and column details.",
    inputLabel: "Input YAML", outputLabel: "Validation result", buttonLabel: "Validate YAML",
    seo: { title: "YAML Validator Online | Formatbase", description: "Validate YAML privately in your browser with line and column diagnostics and explicit safety limits." },
    about: "YAML Validator checks syntax without rewriting the source. It also enforces limits on nesting, aliases, merge keys, and expanded nodes to keep untrusted input bounded.",
    howItWorks: ["Paste YAML or open a .yaml or .yml file.", "Run validation.", "Use the error location to fix syntax or reduce complexity."],
    faq: [
      { question: "Does validation change my YAML?", answer: "No. Validation only reports syntax and safety errors." },
      { question: "Can it validate YAML streams?", answer: "Yes, streams of up to 20 YAML documents are supported." }
    ],
    commonErrors: [
      { title: "Tabs in indentation", description: "YAML indentation must use spaces; tabs can make the document invalid." },
      { title: "Recursive aliases", description: "Self-referential aliases are rejected before they can expand into unsafe structures." },
      { title: "Too many documents", description: "Streams beyond the document limit are rejected with a safety diagnostic." }
    ],
    relatedTools: ["yaml-formatter"], example: "service:\n  name: worker\n  enabled: true"
  }),
  xmlTool({
    id: "xml-formatter", slug: "xml-formatter", name: "XML Formatter", eyebrow: "FORMAT MARKUP", action: "format",
    description: "Indent XML while retaining attributes, namespaces, comments, and CDATA.",
    inputLabel: "Input XML", outputLabel: "Formatted XML", buttonLabel: "Format XML",
    seo: { title: "XML Formatter Online | Formatbase", description: "Format XML locally with safe entity handling, depth limits, and clear syntax diagnostics." },
    about: "XML Formatter parses and indents XML in a browser worker. DOCTYPE declarations and custom entities are blocked. Mixed text and elements stay unchanged because inserting whitespace could change their meaning.",
    howItWorks: ["Paste XML or open an .xml file.", "Choose indentation and format.", "Review the output before copying or downloading."],
    faq: [
      { question: "Does this tool fetch external entities?", answer: "No. DOCTYPE declarations are blocked and entity expansion is disabled." },
      { question: "Why was my mixed-content XML unchanged?", answer: "Whitespace between text and child elements can be meaningful, so the formatter preserves the source and shows a warning." }
    ], relatedTools: ["xml-validator"], example: "<catalog><item id=\"1\">Book</item></catalog>"
  }),
  xmlTool({
    id: "xml-validator", slug: "xml-validator", name: "XML Validator", eyebrow: "CHECK MARKUP", action: "validate",
    description: "Check XML structure and entity safety with source-location errors.",
    inputLabel: "Input XML", outputLabel: "Validation result", buttonLabel: "Validate XML",
    seo: { title: "XML Validator Online | Formatbase", description: "Validate XML locally in your browser with clear errors and restricted entity processing." },
    about: "XML Validator checks well-formed markup without changing the source. It rejects DOCTYPE declarations, custom entities, excessive nesting, and oversized tags.",
    howItWorks: ["Paste XML or open an .xml file.", "Run validation.", "Use the line and column diagnostic to correct the source."],
    faq: [
      { question: "Does validation change my XML?", answer: "No. It checks structure and safety without rewriting the source." },
      { question: "Are namespaces supported?", answer: "Yes. Namespaced element and attribute names are retained." }
    ],
    commonErrors: [
      { title: "Mismatched tag", description: "A closing tag must match the most recent open element name." },
      { title: "Unsafe declaration", description: "DOCTYPE and custom entity declarations are blocked before validation." },
      { title: "Oversized markup", description: "Excessive nesting, tag count, entity references, or tag length are rejected by explicit limits." }
    ],
    relatedTools: ["xml-formatter"], example: "<catalog><item id=\"2\">Guide</item></catalog>"
  }),
  converter({
    id: "json-to-yaml", name: "JSON to YAML", description: "Convert JSON to YAML while keeping exact numeric text where possible.", input: "json", output: "yaml", category: "converters", defaultMode: "lossless",
    about: "This converter parses JSON into a canonical value tree and emits YAML without passing numeric literals through JavaScript numbers. Duplicate JSON keys require a mapping choice; Lossless mode rejects them.",
    example: '{"service":{"name":"api","port":8080}}', relatedTools: ["yaml-to-json", "json-formatter"],
    commonErrors: [
      { title: "Duplicate JSON keys", description: "YAML mappings cannot represent repeated JSON keys without choosing how to collapse them." },
      { title: "Invalid JSON syntax", description: "Trailing commas, comments, and single quoted strings must be fixed before conversion." },
      { title: "Extreme output size", description: "Very large expanded YAML output is stopped before it can allocate excessive text." }
    ],
    faq: [
      { question: "Will large JSON numbers stay exact?", answer: "Yes. The converter carries JSON numeric text through the canonical tree instead of converting it through JavaScript numbers." },
      { question: "Why can duplicate keys stop conversion?", answer: "Lossless mode rejects duplicate keys because YAML cannot keep every repeated JSON property under a normal mapping." },
      { question: "Does JSON to YAML upload my data?", answer: "No. Parsing and conversion run locally in a browser worker." }
    ]
  }),
  converter({
    id: "yaml-to-json", name: "YAML to JSON", description: "Convert YAML to JSON with explicit handling for aliases and merge keys.", input: "yaml", output: "json", category: "converters", defaultMode: "lossless",
    about: "Simple YAML maps, sequences, and scalars convert through a canonical value tree. Lossless mode rejects YAML aliases, merge keys, unsupported scalar tags, and multi-document streams; Best effort materializes them with a warning.",
    example: "service:\n  name: api\n  port: 8080", relatedTools: ["json-to-yaml", "yaml-validator"],
    commonErrors: [
      { title: "Aliases and merge keys", description: "YAML references can duplicate or merge content in ways JSON cannot describe directly." },
      { title: "Multiple documents", description: "JSON has one root value, so YAML streams with several documents need a mode choice." },
      { title: "Unsupported scalar tags", description: "Special YAML tags may not have a plain JSON equivalent and can require best effort materialization." }
    ],
    faq: [
      { question: "Can YAML aliases become JSON?", answer: "Best effort mode can materialize alias values, while Lossless mode stops and explains the mapping loss." },
      { question: "Does validation happen before conversion?", answer: "Yes. Malformed YAML and bounded safety limits are checked before JSON is written." },
      { question: "Will comments appear in the JSON?", answer: "No. JSON has no comment syntax, so comments are not represented in the converted output." }
    ]
  }),
  converter({
    id: "json-to-xml", name: "JSON to XML", description: "Map JSON objects to XML elements or restore a lossless XML envelope.", input: "json", output: "xml", category: "converters", defaultMode: "best-effort",
    about: "Best effort maps one root key to an XML element, @keys to attributes, #text to text, and arrays to repeated elements. Lossless mode accepts a Formatbase XML envelope produced by XML to JSON.",
    example: '{"catalog":{"item":{"@id":"1","#text":"Book"}}}', relatedTools: ["xml-to-json", "xml-validator"],
    commonErrors: [
      { title: "Missing single root", description: "Best effort XML output needs one JSON object key to become the document root element." },
      { title: "Invalid XML names", description: "Object keys used as element or attribute names must be valid XML names." },
      { title: "Envelope required", description: "Lossless mode only accepts the reversible XML envelope produced by the XML to JSON converter." }
    ],
    faq: [
      { question: "How do attributes work?", answer: "In best effort mode, object keys that begin with @ become XML attributes and #text becomes element text." },
      { question: "When should I use Lossless mode?", answer: "Use it when you are converting back from a Formatbase XML envelope and need comments, CDATA, order, and attributes restored." },
      { question: "Can any JSON object become clean XML?", answer: "No. XML has element names, attributes, and one document root, so incompatible JSON structures produce diagnostics." }
    ]
  }),
  converter({
    id: "xml-to-json", name: "XML to JSON", description: "Map XML to readable JSON or a reversible structure envelope.", input: "xml", output: "json", category: "converters", defaultMode: "best-effort",
    about: "Best effort maps attributes to @keys and repeated child elements to arrays. Lossless mode emits a Formatbase XML envelope that retains ordered nodes, attributes, comments, CDATA, and text for conversion back to XML.",
    example: '<order><line sku="BK-1">Book</line><line sku="PN-2">Pen</line></order>', relatedTools: ["json-to-xml", "xml-formatter"],
    commonErrors: [
      { title: "Comments and CDATA", description: "Readable JSON mappings do not keep comment nodes or CDATA boundaries unless you choose the lossless envelope." },
      { title: "Mixed content order", description: "Text and child element order can matter in XML and may not fit a simple object mapping." },
      { title: "DOCTYPE declarations", description: "DOCTYPE and custom entity declarations are blocked before conversion for safety." }
    ],
    faq: [
      { question: "What is the XML envelope?", answer: "It is a reversible JSON structure used by Formatbase to keep XML node order, attributes, comments, CDATA, and text." },
      { question: "Why does best effort warn about mapping loss?", answer: "A readable object shape is easier to use, but it cannot represent every XML node boundary and ordering detail." },
      { question: "Does XML to JSON expand entities?", answer: "No. DOCTYPE is blocked and entity expansion is disabled before conversion." }
    ]
  }),
  converter({
    id: "json-to-csv", name: "JSON to CSV", description: "Convert arrays of JSON objects to spreadsheet-ready CSV.", input: "json", output: "csv", category: "csv", defaultMode: "best-effort",
    about: "CSV has text cells and a fixed set of columns. Lossless mode accepts flat string-only objects with complete keys. Best effort converts scalar types; Compatibility mode also serializes nested values into JSON text inside cells. Formula-like cells are escaped for spreadsheet safety.",
    example: '[{"name":"Aisha","age":30},{"name":"Zoe","age":28}]', relatedTools: ["csv-to-json", "json-formatter"],
    commonErrors: [
      { title: "Nested values", description: "Objects and arrays do not fit ordinary CSV cells unless Compatibility mode serializes them as JSON text." },
      { title: "Missing columns", description: "Rows with different object keys require a column union and may not be lossless." },
      { title: "Formula-like cells", description: "Cells starting with spreadsheet formula characters are escaped in the CSV output." }
    ],
    faq: [
      { question: "What JSON shape works best?", answer: "An array of flat objects works best because each object becomes one CSV row." },
      { question: "Will numbers stay typed in CSV?", answer: "CSV stores cell text, so Best effort mode warns when JSON numbers, booleans, or null values become cells." },
      { question: "Why are some cells prefixed with an apostrophe?", answer: "Formula-like cell text is escaped so spreadsheet apps treat it as text." }
    ]
  }),
  converter({
    id: "csv-to-json", name: "CSV to JSON", description: "Convert CSV rows to JSON objects while preserving cell text.", input: "csv", output: "json", category: "csv", defaultMode: "lossless",
    about: "The first CSV row supplies column names. Lossless mode keeps every cell as a string. Best effort infers JSON numbers and booleans with a warning because CSV does not carry type information.",
    example: "name,age\nAisha,30\nZoe,28", relatedTools: ["json-to-csv", "json-validator"],
    commonErrors: [
      { title: "Duplicate headers", description: "Repeated column names cannot become unique JSON object keys without losing information." },
      { title: "Uneven rows", description: "Rows with a different number of cells than the header are rejected before conversion." },
      { title: "Malformed quotes", description: "Unclosed or misplaced CSV quotes are reported before any JSON output is created." }
    ],
    faq: [
      { question: "Does CSV to JSON infer types?", answer: "Lossless mode keeps every cell as a string. Best effort mode can infer numbers and booleans with a warning." },
      { question: "Why does the first row matter?", answer: "The first row becomes the set of JSON property names for each following row." },
      { question: "Can duplicate CSV headers be converted?", answer: "No. Duplicate headers are rejected because JSON object keys would collide." }
    ]
  })
];

export const categories = [
  { id: "json", name: "JSON tools", description: "Format, validate, minify, and organize JSON privately in your browser." },
  { id: "sql", name: "SQL tools", description: "Format SQL queries locally with controls for dialect, casing, and layout." },
  { id: "yaml", name: "YAML tools", description: "Format and validate YAML locally with explicit parser safety limits." },
  { id: "xml", name: "XML tools", description: "Format and validate XML locally with restricted entity processing." },
  { id: "csv", name: "CSV tools", description: "Convert CSV and JSON while preserving cell text or choosing type inference." },
  { id: "converters", name: "Converters", description: "Convert between JSON, YAML, and XML with explicit mapping choices." }
] as const;
export function getTool(slug: string): Tool | undefined { return tools.find(tool => tool.slug === slug); }
export function getToolById(id: ToolId): Tool | undefined { return tools.find(tool => tool.id === id); }
export function getCategory(id: string) { return categories.find(category => category.id === id); }
export function getCategoryTools(id: string): Tool[] { return tools.filter(tool => tool.category === id); }
export function validateRegistry(definitions: Tool[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const tool of definitions) {
    if (ids.has(tool.id)) errors.push(`Duplicate tool id: ${tool.id}`);
    if (slugs.has(tool.slug)) errors.push(`Duplicate tool slug: ${tool.slug}`);
    ids.add(tool.id); slugs.add(tool.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.slug)) errors.push(`Invalid slug: ${tool.slug}`);
    if (!categories.some(category => category.id === tool.category)) errors.push(`Unknown category ${tool.category} on ${tool.id}`);
    if (!tool.operations.includes(tool.action)) errors.push(`Action ${tool.action} is not listed for ${tool.id}`);
    for (const related of tool.relatedTools) if (!definitions.some(candidate => candidate.id === related)) errors.push(`Unknown related tool ${related} on ${tool.id}`);
    for (const option of tool.options) {
      if (option.type === "select" && (!option.choices?.length || !option.choices.some(choice => choice.value === option.defaultValue))) errors.push(`Invalid choices for ${tool.id}.${option.id}`);
    }
  }
  return errors;
}
