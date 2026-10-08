// Textes du formateur et validateur JSON (FR/EN). Les erreurs sont indexées par les codes de src/lib/json.js.
export const JSON_TOOL = {
  fr: {
    ui: {
      meta: {
        title: 'Formateur et validateur JSON en ligne | Guillaume Richard',
        description:
          "Validez, indentez, minifiez et triez du JSON dans votre navigateur. Chaque erreur est localisée (ligne, colonne) avec une explication. Les nombres et les chaînes ne sont jamais modifiés. Rien n'est envoyé.",
        appDescription:
          'Outil gratuit pour valider, formater, minifier et trier du JSON (RFC 8259), avec erreurs localisées à la ligne et à la colonne. Traitement local dans le navigateur.',
      },
      name: 'Formateur et validateur JSON',
      card: 'Valide, indente, minifie et trie du JSON ; localise chaque erreur à la ligne et à la colonne.',
      keywords:
        'json formateur validateur formatter beautify minify indenter minifier trier cles erreur syntaxe lint',
      h1: 'Formateur et validateur JSON',
      intro:
        "Collez du JSON : l'outil le valide, l'indente ou le minifie, et indique l'endroit exact d'une erreur (ligne et colonne) avec une explication claire. Les nombres et les chaînes sont recopiés tels quels : un identifiant à 20 chiffres ne sera pas arrondi. Tout se passe dans votre navigateur.",
      form: {
        input: 'JSON à analyser',
        placeholder: '{"nom": "exemple", "valeurs": [1, 2, 3]}',
        output: 'Résultat',
        indent: 'Mise en forme',
        indents: { 2: '2 espaces', 4: '4 espaces', tab: 'Tabulation', min: 'Minifié' },
        sortKeys: 'Trier les clés par ordre alphabétique',
        sample: 'Insérer un exemple',
        clear: 'Effacer',
        download: 'Télécharger',
        goto: "Aller à l'erreur",
        sampleText:
          '{"nom":"Exemple","actif":true,"version":2.1,"etiquettes":["réseau","dns"],"contact":{"mail":"contact@exemple.fr","telephone":null}}',
      },
      status: {
        empty: 'Collez du JSON pour commencer.',
        valid: 'JSON valide',
        invalid: 'JSON invalide',
        position: (line: number, column: number) => `ligne ${line}, colonne ${column}`,
        announceValid: 'JSON valide',
        announceInvalid: (line: number, column: number) =>
          `JSON invalide, ligne ${line}, colonne ${column}`,
      },
      stats: {
        size: 'Taille',
        bytes: 'octets',
        keys: 'clés',
        items: 'éléments de tableau',
        depth: 'profondeur',
        saved: (before: string, after: string) => `${before} → ${after} octets`,
        duplicates: (list: string) =>
          `Clés en double : ${list}. JSON.parse ne garde que la dernière valeur de chaque clé ; l'outil les conserve toutes.`,
      },
      errors: {
        unexpectedEnd:
          'Le document se termine trop tôt : il manque une accolade, un crochet, un guillemet ou une valeur.',
        unexpectedChar: (c: string) => `Caractère inattendu « ${c} ».`,
        trailingComma:
          'Virgule en trop avant la fermeture : le JSON n’autorise pas de virgule finale.',
        expectedKey: 'Une clé entre guillemets doubles est attendue ici.',
        expectedColon: 'Il manque « : » entre la clé et sa valeur.',
        expectedCommaOrEnd:
          'Il manque une virgule entre deux éléments, ou la fermeture « } » ou « ] ».',
        trailingContent: 'Du contenu suit la fin du document : un seul document JSON est accepté.',
        unterminatedString: 'Chaîne non fermée : il manque un guillemet fermant.',
        controlChar:
          'Saut de ligne ou caractère de contrôle dans une chaîne : écrivez-le \\n ou \\t.',
        badEscape: (c: string) => `Séquence d’échappement invalide « \\${c} ».`,
        badUnicode: 'Séquence \\u invalide : elle doit être suivie de 4 chiffres hexadécimaux.',
        leadingZero: 'Un nombre ne peut pas commencer par un zéro superflu (écrivez 7, pas 07).',
        badNumber: 'Nombre mal formé.',
        tooDeep: 'Imbrication trop profonde (512 niveaux au maximum).',
        tooLarge: 'Texte trop volumineux (5 millions de caractères au maximum).',
      },
      hints: {
        singleQuote: 'Le JSON exige des guillemets doubles ("), pas des apostrophes.',
        comment: 'Le JSON n’accepte pas les commentaires.',
        nonJsonValue:
          'NaN, Infinity et undefined n’existent pas en JSON : utilisez null, un nombre ou une chaîne.',
        unquotedKey: 'En JSON, les clés doivent être entre guillemets doubles.',
      },
      common: { copy: 'Copier le résultat', copied: 'Résultat copié' },
      privacy:
        'Le JSON saisi est analysé dans votre navigateur ; il n’est ni envoyé ni enregistré.',
      seo: {
        whatTitle: "Ce que fait l'outil",
        what: [
          [
            'Validation précise',
            "Analyse stricte selon la RFC 8259 : l'erreur est localisée à la ligne et à la colonne, expliquée en français ou en anglais, avec un indice pour les fautes fréquentes (apostrophes, virgule finale, commentaires, clés sans guillemets).",
          ],
          [
            'Mise en forme sans perte',
            "Indentation de 2 ou 4 espaces, tabulation ou minification. Les nombres et les chaînes sont recopiés tels qu'écrits : 12345678901234567890 ou 1.10 ne sont pas arrondis, contrairement à un passage par JSON.parse puis JSON.stringify.",
          ],
          [
            'Tri des clés',
            "Un tri alphabétique à tous les niveaux rend deux documents comparables d'un coup d'œil ou avec un outil de comparaison. Les tableaux gardent leur ordre.",
          ],
          [
            'Clés en double',
            "Le JSON les tolère mais la plupart des analyseurs n'en gardent qu'une. L'outil les signale pour que vous ne perdiez pas une valeur sans le savoir.",
          ],
        ],
        howTitle: 'Comment l’utiliser',
        how: "Collez le document dans la zone de saisie : la validation est immédiate. Si une erreur est signalée, le bouton « Aller à l'erreur » place le curseur à l'endroit concerné. Choisissez ensuite la mise en forme, puis copiez ou téléchargez le résultat. Limites : 5 millions de caractères et 512 niveaux d'imbrication. L'outil ne vérifie que la syntaxe : il ne valide pas un schéma JSON, et ne tolère ni commentaires ni virgules finales (JSONC et JSON5 ne sont pas du JSON).",
        faq: [
          [
            'Pourquoi mon JSON est-il refusé alors qu’il fonctionne en JavaScript ?',
            "Un littéral JavaScript accepte les apostrophes, les clés sans guillemets, les commentaires et les virgules finales. Le JSON, lui, est un format d'échange plus strict : guillemets doubles obligatoires, ni commentaire ni virgule finale.",
          ],
          [
            'Mes grands nombres sont-ils modifiés ?',
            "Non. L'outil ne convertit jamais les valeurs : un identifiant à 20 chiffres reste identique. Attention toutefois à JavaScript, qui l'arrondirait en le lisant avec JSON.parse (au-delà de 9 007 199 254 740 991).",
          ],
          [
            'Mes données sont-elles envoyées quelque part ?',
            "Non. L'analyse tourne dans votre navigateur, sans requête réseau : vous pouvez l'utiliser avec des données internes.",
          ],
        ],
      },
      related: 'Voir aussi',
      relatedLinks: [],
    },
  },
  en: {
    ui: {
      meta: {
        title: 'Online JSON formatter and validator | Guillaume Richard',
        description:
          'Validate, indent, minify and sort JSON in your browser. Every error is located (line, column) and explained. Numbers and strings are never altered. Nothing is uploaded.',
        appDescription:
          'Free tool to validate, format, minify and sort JSON (RFC 8259), with errors located to the line and column. Runs locally in the browser.',
      },
      name: 'JSON formatter and validator',
      card: 'Validates, indents, minifies and sorts JSON; locates each error to the line and column.',
      keywords: 'json formatter validator beautify minify indent sort keys error syntax lint',
      h1: 'JSON formatter and validator',
      intro:
        'Paste some JSON: the tool validates it, indents or minifies it, and shows the exact place of an error (line and column) with a clear explanation. Numbers and strings are copied as written: a 20-digit identifier will not be rounded. Everything happens in your browser.',
      form: {
        input: 'JSON to analyze',
        placeholder: '{"name": "example", "values": [1, 2, 3]}',
        output: 'Result',
        indent: 'Formatting',
        indents: { 2: '2 spaces', 4: '4 spaces', tab: 'Tab', min: 'Minified' },
        sortKeys: 'Sort keys alphabetically',
        sample: 'Insert an example',
        clear: 'Clear',
        download: 'Download',
        goto: 'Go to the error',
        sampleText:
          '{"name":"Example","active":true,"version":2.1,"tags":["network","dns"],"contact":{"mail":"contact@example.com","phone":null}}',
      },
      status: {
        empty: 'Paste some JSON to start.',
        valid: 'Valid JSON',
        invalid: 'Invalid JSON',
        position: (line: number, column: number) => `line ${line}, column ${column}`,
        announceValid: 'Valid JSON',
        announceInvalid: (line: number, column: number) =>
          `Invalid JSON, line ${line}, column ${column}`,
      },
      stats: {
        size: 'Size',
        bytes: 'bytes',
        keys: 'keys',
        items: 'array items',
        depth: 'depth',
        saved: (before: string, after: string) => `${before} → ${after} bytes`,
        duplicates: (list: string) =>
          `Duplicate keys: ${list}. JSON.parse keeps only the last value of each key; this tool keeps them all.`,
      },
      errors: {
        unexpectedEnd: 'The document ends too early: a brace, bracket, quote or value is missing.',
        unexpectedChar: (c: string) => `Unexpected character “${c}”.`,
        trailingComma:
          'Extra comma before the closing bracket: JSON does not allow a trailing comma.',
        expectedKey: 'A key in double quotes is expected here.',
        expectedColon: 'A “:” is missing between the key and its value.',
        expectedCommaOrEnd: 'A comma is missing between two items, or the closing “}” or “]”.',
        trailingContent:
          'Content follows the end of the document: only one JSON document is accepted.',
        unterminatedString: 'Unterminated string: the closing quote is missing.',
        controlChar: 'Line break or control character inside a string: write it as \\n or \\t.',
        badEscape: (c: string) => `Invalid escape sequence “\\${c}”.`,
        badUnicode: 'Invalid \\u sequence: it must be followed by 4 hexadecimal digits.',
        leadingZero: 'A number cannot start with a superfluous zero (write 7, not 07).',
        badNumber: 'Malformed number.',
        tooDeep: 'Nesting is too deep (512 levels at most).',
        tooLarge: 'Text is too large (5 million characters at most).',
      },
      hints: {
        singleQuote: 'JSON requires double quotes ("), not apostrophes.',
        comment: 'JSON does not accept comments.',
        nonJsonValue:
          'NaN, Infinity and undefined do not exist in JSON: use null, a number or a string.',
        unquotedKey: 'In JSON, keys must be in double quotes.',
      },
      common: { copy: 'Copy the result', copied: 'Result copied' },
      privacy: 'The JSON you enter is analyzed in your browser; it is neither sent nor stored.',
      seo: {
        whatTitle: 'What the tool does',
        what: [
          [
            'Precise validation',
            'Strict parsing per RFC 8259: the error is located to the line and column and explained, with a hint for common mistakes (apostrophes, trailing comma, comments, unquoted keys).',
          ],
          [
            'Lossless formatting',
            'Indent with 2 or 4 spaces or a tab, or minify. Numbers and strings are copied as written: 12345678901234567890 or 1.10 are not rounded, unlike a round trip through JSON.parse and JSON.stringify.',
          ],
          [
            'Key sorting',
            'An alphabetical sort at every level makes two documents comparable at a glance or with a diff tool. Arrays keep their order.',
          ],
          [
            'Duplicate keys',
            'JSON tolerates them but most parsers keep only one. The tool flags them so you do not lose a value without knowing.',
          ],
        ],
        howTitle: 'How to use it',
        how: 'Paste the document in the input area: validation is immediate. If an error is reported, the “Go to the error” button places the cursor at the spot. Then choose the formatting, and copy or download the result. Limits: 5 million characters and 512 nesting levels. The tool only checks syntax: it does not validate against a JSON Schema, and it accepts neither comments nor trailing commas (JSONC and JSON5 are not JSON).',
        faq: [
          [
            'Why is my JSON rejected when it works in JavaScript?',
            'A JavaScript literal accepts apostrophes, unquoted keys, comments and trailing commas. JSON is a stricter interchange format: double quotes are required, with no comments and no trailing comma.',
          ],
          [
            'Are my large numbers modified?',
            'No. The tool never converts values: a 20-digit identifier stays identical. Beware of JavaScript though, which would round it when reading it with JSON.parse (beyond 9,007,199,254,740,991).',
          ],
          [
            'Is my data sent anywhere?',
            'No. The analysis runs in your browser with no network request, so you can use it with internal data.',
          ],
        ],
      },
      related: 'See also',
      relatedLinks: [],
    },
  },
};
