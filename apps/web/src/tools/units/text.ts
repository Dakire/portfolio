// Textes du convertisseur d'unités informatiques (FR/EN) : tailles, débits et temps de transfert, bases numériques.
export const UNITS_TOOL = {
  fr: {
    ui: {
      meta: {
        title: 'Calcul du temps de téléchargement : taille, débit et durée | Guillaume Richard',
        description:
          "Calculez le temps de téléchargement d'un fichier selon sa taille et votre débit, ou la bande passante nécessaire pour le charger en un temps donné. Gratuit.",
        appDescription:
          'Calculateur gratuit du temps de téléchargement et de la bande passante nécessaire, avec conversion des tailles (Go/Gio), des débits (Mbit/s, Mo/s) et des bases numériques.',
      },
      name: 'Temps de téléchargement et unités',
      card: 'Temps de téléchargement d’un fichier, bande passante nécessaire, conversions Go/Gio, Mbit/s, hexadécimal et binaire.',
      keywords:
        'calcul temps de telechargement bande passante necessaire duree transfert fichier debit mbit convertisseur octet go gio mo mio hexadecimal binaire octal decimal base bit byte',
      h1: 'Calculateur de temps de téléchargement',
      intro:
        "Combien de temps pour télécharger ou copier un fichier ? Saisissez sa taille et votre débit : la durée s'affiche aussitôt. Dans l'autre sens, indiquez la taille et le temps que vous voulez y consacrer pour connaître la bande passante nécessaire. L'outil convertit aussi les tailles (Go, Gio) et les bases numériques.",
      tabs: {
        label: 'Type de conversion',
        transfer: 'Temps de téléchargement',
        bandwidth: 'Bande passante nécessaire',
        data: 'Tailles',
        base: 'Bases numériques',
      },
      labels: {
        bit: 'bit',
        B: 'o',
        kB: 'ko',
        MB: 'Mo',
        GB: 'Go',
        TB: 'To',
        PB: 'Po',
        KiB: 'Kio',
        MiB: 'Mio',
        GiB: 'Gio',
        TiB: 'Tio',
        PiB: 'Pio',
        'bit/s': 'bit/s',
        'kbit/s': 'kbit/s',
        'Mbit/s': 'Mbit/s',
        'Gbit/s': 'Gbit/s',
        'Tbit/s': 'Tbit/s',
        'B/s': 'o/s',
        'kB/s': 'ko/s',
        'MB/s': 'Mo/s',
        'GB/s': 'Go/s',
        'MiB/s': 'Mio/s',
        'GiB/s': 'Gio/s',
      },
      common: {
        value: 'Valeur',
        unit: 'Unité',
        copy: 'Copier',
        copied: 'Copié',
        result: 'Résultat',
        unitCol: 'Unité',
        valueCol: 'Valeur',
        normCol: 'Norme',
      },
      errors: {
        invalid: 'Saisissez un nombre (par exemple 1024 ou 1,5).',
        negative: 'La valeur ne peut pas être négative.',
        tooLarge: 'Valeur trop grande (1 × 10²¹ au maximum).',
        zeroRate: 'Le débit doit être supérieur à zéro.',
        efficiency: 'Le rendement doit être compris entre 1 et 100 %.',
      },
      data: {
        hint: 'Exemples : 500 (Go d’un disque), 1,5 (To), 4096 (Mio).',
        empty: 'Saisissez une taille pour la voir dans toutes les unités.',
        norms: { bit: '—', SI: 'SI (×1000)', IEC: 'CEI (×1024)' },
        note: 'Les fabricants de disques annoncent des Go (×1000) alors que Windows affiche des Gio (×1024) sous le nom « Go » : un disque de 500 Go est affiché autour de 465 Go.',
      },
      transfer: {
        size: 'Quantité de données',
        rate: 'Débit',
        efficiency: 'Rendement utile (%)',
        efficiencyHint:
          'Part du débit nominal réellement utile : en pratique 90 à 95 % sur un réseau local, moins sur une liaison chargée. 100 pour la valeur théorique.',
        result: 'Durée estimée',
        theoretical: (seconds: string) => `soit ${seconds} secondes`,
        effective: (rate: string) => `Débit utile retenu : ${rate}`,
        units: { d: 'j', h: 'h', min: 'min', s: 's', ms: 'ms' },
        tooLong: 'plus de 100 ans',
        converted: 'Le débit dans toutes les unités',
      },
      bandwidth: {
        size: 'Taille des données',
        hours: 'Heures',
        minutes: 'Minutes',
        seconds: 'Secondes',
        result: 'Bande passante nécessaire',
        explain:
          'Débit nominal minimal pour transférer ces données dans le temps indiqué, avec le rendement utile choisi.',
        zeroDuration: 'Indiquez une durée supérieure à zéro.',
      },
      base: {
        input: 'Nombre entier',
        from: 'Base de la saisie',
        bases: {
          dec: 'Décimal (10)',
          hex: 'Hexadécimal (16)',
          bin: 'Binaire (2)',
          oct: 'Octal (8)',
        },
        hint: 'Préfixes 0x, 0b, 0o acceptés ; espaces et « _ » ignorés ; signe « - » accepté.',
        errors: {
          invalid: (base: number) => `Caractère non valide en base ${base}.`,
          tooLong: 'Nombre trop long (512 chiffres au maximum).',
        },
        empty: 'Saisissez un entier pour le voir dans les quatre bases.',
        rows: {
          dec: 'Décimal',
          hex: 'Hexadécimal',
          bin: 'Binaire',
          binGrouped: 'Binaire par 4 bits',
          oct: 'Octal',
          bits: 'Taille minimale',
        },
        bits: (n: number) => `${n} bit${n > 1 ? 's' : ''}`,
        note: 'Les entiers sont calculés sans limite de précision. Un nombre négatif est affiché avec son signe, pas en complément à deux.',
      },
      seo: {
        whatTitle: "Ce que fait l'outil",
        what: [
          [
            'Tailles SI et binaires',
            "Un octet, un kilo-octet (1000 octets) et un kibioctet (1024 octets) ne sont pas la même chose. L'outil affiche la valeur dans les douze unités, du bit au pébioctet, avec la norme de chacune.",
          ],
          [
            'Temps de téléchargement',
            "Combien de temps pour copier 50 Go à 1 Gbit/s ? Entrez la quantité, le débit et le rendement utile : la durée s'affiche en jours, heures, minutes et secondes, et le débit est converti dans toutes les unités (Mbit/s, Mo/s…).",
          ],
          [
            'Bases numériques',
            'Décimal, hexadécimal, binaire et octal avec une précision illimitée (calcul sur des entiers de taille quelconque), préfixes 0x, 0b, 0o acceptés et binaire groupé par quatre bits.',
          ],
          [
            'Saisie tolérante',
            'La virgule ou le point décimal, les espaces et les soulignés dans les nombres sont acceptés ; les valeurs invalides, négatives ou démesurées sont refusées avec un message.',
          ],
        ],
        howTitle: 'Comment l’utiliser',
        how: "Choisissez l'onglet (temps de téléchargement, bande passante nécessaire, tailles ou bases), saisissez la valeur et l'unité : le résultat est immédiat et chaque ligne se copie. Pour une durée de transfert, gardez un rendement de 90 à 95 % afin d'approcher la réalité d'un réseau local : l'estimation reste théorique, car elle ne tient compte ni de la latence, ni des petits fichiers, ni de la charge du réseau, du disque ou du processeur. Les tailles utilisent des nombres à virgule flottante (15 chiffres significatifs), de quoi couvrir jusqu'à plusieurs exaoctets.",
        faq: [
          [
            'Combien de temps pour télécharger 50 Go à 100 Mbit/s ?',
            '1 h 6 min 40 s en théorie : 50 Go font 400 000 Mbit, divisés par 100 Mbit/s, soit 4 000 s. Avec un rendement réel de 90 %, comptez environ 1 h 14 min.',
          ],
          [
            'Combien de temps pour télécharger 10 Go à 1 Gbit/s ?',
            '1 min 20 s en théorie, environ 1 min 29 s avec un rendement de 90 %. Un To à 1 Gbit/s prend 2 h 13 min 20 s en théorie (environ 2 h 28 min à 90 %).',
          ],
          [
            'Comment calculer le temps de téléchargement d’un fichier ?',
            'Durée (s) = taille (octets) × 8 ÷ (débit (bit/s) × rendement). Exemple : 2 Go (2 × 10⁹ octets) à 50 Mbit/s : 16 × 10⁹ ÷ 50 × 10⁶ = 320 s, soit 5 min 20 s. L’outil fait ce calcul et gère les unités (Go ou Gio, Mbit/s ou Mo/s).',
          ],
          [
            'Comment calculer la bande passante nécessaire ?',
            'Bande passante (bit/s) = taille (octets) × 8 ÷ (durée (s) × rendement). Exemple : sauvegarder 200 Go en 8 heures demande environ 55,6 Mbit/s en théorie, 61,7 Mbit/s à 90 % de rendement. Utilisez l’onglet « Bande passante nécessaire ».',
          ],
          [
            'Pourquoi mon téléchargement est-il plus lent que le débit annoncé ?',
            'Le débit annoncé est un maximum théorique, en bits : les en-têtes réseau, le Wi-Fi, la charge du serveur distant, la latence, le disque et le nombre de petits fichiers réduisent le débit utile. Comptez 85 à 95 % sur un réseau câblé, moins en Wi-Fi ou sur une liaison partagée.',
          ],
          [
            'Quelle différence entre Go et Gio ?',
            "Le gigaoctet (Go) vaut 1 000 000 000 octets, le gibioctet (Gio) vaut 1 073 741 824 octets (1024³). Windows affiche des Gio mais les appelle « Go », d'où les capacités de disque apparemment plus faibles que celles de l'emballage.",
          ],
          [
            'Pourquoi un débit en Mbit/s et un fichier en Mo ?',
            'Les opérateurs et les cartes réseau annoncent des bits par seconde, les fichiers se mesurent en octets (1 octet = 8 bits). Une liaison de 100 Mbit/s transfère au mieux 12,5 Mo par seconde.',
          ],
          [
            'Les nombres hexadécimaux très grands sont-ils exacts ?',
            "Oui : les conversions de bases utilisent des entiers de précision arbitraire, jusqu'à 512 chiffres, sans arrondi à 53 bits comme avec les nombres JavaScript ordinaires.",
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
        title: 'Download Time Calculator: File Size, Speed and Bandwidth | Guillaume Richard',
        description:
          'Calculate how long a file takes to download from its size and your speed, or the bandwidth needed to transfer it in a given time. Also converts GB to GiB. Free.',
        appDescription:
          'Free download time and required-bandwidth calculator, with conversion of sizes (GB/GiB), rates (Mbit/s, MB/s) and number bases.',
      },
      name: 'Download time and units',
      card: 'File download time, bandwidth needed, GB to GiB, Mbit/s, hexadecimal and binary conversions.',
      keywords:
        'download time calculator bandwidth needed transfer time file size speed mbit converter byte gb to gib mb mib hexadecimal binary octal decimal base bit',
      h1: 'Download time calculator',
      intro:
        'How long does it take to download or copy a file? Enter its size and your speed: the duration appears right away. The other way round, enter the size and the time you can spend to get the bandwidth needed. The tool also converts sizes (GB, GiB) and number bases.',
      tabs: {
        label: 'Conversion type',
        transfer: 'Download time',
        bandwidth: 'Bandwidth needed',
        data: 'Sizes',
        base: 'Number bases',
      },
      labels: {
        bit: 'bit',
        B: 'B',
        kB: 'kB',
        MB: 'MB',
        GB: 'GB',
        TB: 'TB',
        PB: 'PB',
        KiB: 'KiB',
        MiB: 'MiB',
        GiB: 'GiB',
        TiB: 'TiB',
        PiB: 'PiB',
        'bit/s': 'bit/s',
        'kbit/s': 'kbit/s',
        'Mbit/s': 'Mbit/s',
        'Gbit/s': 'Gbit/s',
        'Tbit/s': 'Tbit/s',
        'B/s': 'B/s',
        'kB/s': 'kB/s',
        'MB/s': 'MB/s',
        'GB/s': 'GB/s',
        'MiB/s': 'MiB/s',
        'GiB/s': 'GiB/s',
      },
      common: {
        value: 'Value',
        unit: 'Unit',
        copy: 'Copy',
        copied: 'Copied',
        result: 'Result',
        unitCol: 'Unit',
        valueCol: 'Value',
        normCol: 'Standard',
      },
      errors: {
        invalid: 'Enter a number (for example 1024 or 1.5).',
        negative: 'The value cannot be negative.',
        tooLarge: 'Value too large (1 × 10²¹ at most).',
        zeroRate: 'The rate must be greater than zero.',
        efficiency: 'The efficiency must be between 1 and 100%.',
      },
      data: {
        hint: 'Examples: 500 (GB of a disk), 1.5 (TB), 4096 (MiB).',
        empty: 'Enter a size to see it in every unit.',
        norms: { bit: '—', SI: 'SI (×1000)', IEC: 'IEC (×1024)' },
        note: 'Disk makers advertise GB (×1000) while Windows displays GiB (×1024) under the name “GB”: a 500 GB disk shows up as about 465 GB.',
      },
      transfer: {
        size: 'Amount of data',
        rate: 'Rate',
        efficiency: 'Useful throughput (%)',
        efficiencyHint:
          'Share of the nominal rate that is actually usable: in practice 90 to 95% on a local network, less on a busy link. Use 100 for the theoretical value.',
        result: 'Estimated duration',
        theoretical: (seconds: string) => `that is ${seconds} seconds`,
        effective: (rate: string) => `Useful rate used: ${rate}`,
        units: { d: 'd', h: 'h', min: 'min', s: 's', ms: 'ms' },
        tooLong: 'more than 100 years',
        converted: 'The rate in every unit',
      },
      bandwidth: {
        size: 'Amount of data',
        hours: 'Hours',
        minutes: 'Minutes',
        seconds: 'Seconds',
        result: 'Bandwidth needed',
        explain:
          'Minimum nominal rate to transfer this data in the given time, with the chosen useful throughput.',
        zeroDuration: 'Enter a duration greater than zero.',
      },
      base: {
        input: 'Integer',
        from: 'Base of the input',
        bases: {
          dec: 'Decimal (10)',
          hex: 'Hexadecimal (16)',
          bin: 'Binary (2)',
          oct: 'Octal (8)',
        },
        hint: '0x, 0b, 0o prefixes accepted; spaces and “_” ignored; “-” sign accepted.',
        errors: {
          invalid: (base: number) => `Invalid character in base ${base}.`,
          tooLong: 'Number too long (512 digits at most).',
        },
        empty: 'Enter an integer to see it in the four bases.',
        rows: {
          dec: 'Decimal',
          hex: 'Hexadecimal',
          bin: 'Binary',
          binGrouped: 'Binary by 4 bits',
          oct: 'Octal',
          bits: 'Minimum size',
        },
        bits: (n: number) => `${n} bit${n > 1 ? 's' : ''}`,
        note: 'Integers are computed with no precision limit. A negative number is shown with its sign, not in two’s complement.',
      },
      seo: {
        whatTitle: 'What the tool does',
        what: [
          [
            'SI and binary sizes',
            'A byte, a kilobyte (1,000 bytes) and a kibibyte (1,024 bytes) are not the same thing. The tool shows the value in twelve units, from the bit to the pebibyte, with the standard of each.',
          ],
          [
            'Download time',
            'How long to copy 50 GB at 1 Gbit/s? Enter the amount, the rate and the useful throughput: the duration is shown in days, hours, minutes and seconds, and the rate is converted into every unit (Mbit/s, MB/s…).',
          ],
          [
            'Number bases',
            'Decimal, hexadecimal, binary and octal with unlimited precision (computed on integers of any size), 0x, 0b, 0o prefixes accepted and binary grouped by four bits.',
          ],
          [
            'Forgiving input',
            'A decimal comma or point, spaces and underscores inside numbers are accepted; invalid, negative or oversized values are rejected with a message.',
          ],
        ],
        howTitle: 'How to use it',
        how: 'Pick the tab (download time, bandwidth needed, sizes or bases), enter the value and the unit: the result is immediate and each line can be copied. For a transfer time, keep a useful throughput of 90 to 95% to get close to a local network in practice: the estimate stays theoretical, as it ignores latency, small files and the load on the network, disk or processor. Sizes use floating-point numbers (15 significant digits), enough to cover several exabytes.',
        faq: [
          [
            'How long to download 50 GB at 100 Mbit/s?',
            '1 h 6 min 40 s in theory: 50 GB is 400,000 Mbit, divided by 100 Mbit/s, that is 4,000 s. With a real-world 90% efficiency, expect about 1 h 14 min.',
          ],
          [
            'How long to download 10 GB at 1 Gbit/s?',
            '1 min 20 s in theory, about 1 min 29 s at 90% efficiency. One TB at 1 Gbit/s takes 2 h 13 min 20 s in theory (about 2 h 28 min at 90%).',
          ],
          [
            'How do I calculate the download time of a file?',
            'Time (s) = size (bytes) × 8 ÷ (rate (bit/s) × efficiency). Example: 2 GB (2 × 10⁹ bytes) at 50 Mbit/s: 16 × 10⁹ ÷ 50 × 10⁶ = 320 s, that is 5 min 20 s. The tool does this calculation and handles units (GB or GiB, Mbit/s or MB/s).',
          ],
          [
            'How do I calculate the bandwidth I need?',
            'Bandwidth (bit/s) = size (bytes) × 8 ÷ (time (s) × efficiency). Example: backing up 200 GB in 8 hours needs about 55.6 Mbit/s in theory, 61.7 Mbit/s at 90% efficiency. Use the “Bandwidth needed” tab.',
          ],
          [
            'Why is my download slower than the advertised speed?',
            'The advertised speed is a theoretical maximum, in bits: network headers, Wi-Fi, the remote server load, latency, the disk and many small files reduce the useful rate. Expect 85 to 95% on a wired network, less on Wi-Fi or a shared link.',
          ],
          [
            'What is the difference between GB and GiB?',
            'The gigabyte (GB) is 1,000,000,000 bytes, the gibibyte (GiB) is 1,073,741,824 bytes (1024³). Windows displays GiB but calls them “GB”, hence disk capacities that seem lower than on the box.',
          ],
          [
            'Why a rate in Mbit/s but a file in MB?',
            'Carriers and network cards advertise bits per second, files are measured in bytes (1 byte = 8 bits). A 100 Mbit/s link transfers at best 12.5 MB per second.',
          ],
          [
            'Are very large hexadecimal numbers exact?',
            'Yes: base conversions use arbitrary-precision integers, up to 512 digits, with no 53-bit rounding as with ordinary JavaScript numbers.',
          ],
        ],
      },
      related: 'See also',
      relatedLinks: [],
    },
  },
};
