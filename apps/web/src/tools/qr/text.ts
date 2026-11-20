// Textes du générateur de QR codes (FR/EN).
export const QR_TOOL = {
  fr: {
    ui: {
      meta: {
        title: 'Générateur de QR code gratuit : Wi-Fi, vCard, URL, logo | Guillaume Richard',
        description:
          'QR code gratuit : Wi-Fi, lien, vCard, e-mail, SMS, WhatsApp, position, événement. Formes, couleurs, logo, export PNG et SVG, tout dans votre navigateur.',
        appDescription:
          "Générateur gratuit de QR codes (URL, texte, Wi-Fi, e-mail, téléphone, SMS, WhatsApp, géolocalisation, vCard, événement) avec formes, couleurs, dégradé et logo, export PNG et SVG. Aucune donnée n'est envoyée.",
      },
      name: 'Générateur de QR code',
      card: 'QR codes pour un lien, un Wi-Fi, une vCard, un événement…, avec formes, couleurs et logo, export PNG et SVG.',
      keywords:
        'qr code generateur gratuit wifi vcard url lien sms whatsapp email telephone geolocalisation evenement logo png svg couleur',
      h1: 'Générateur de QR code',
      intro:
        "Choisissez le type de contenu, remplissez les champs et téléchargez le QR code en PNG ou en SVG. Le code se calcule dans votre navigateur : ce que vous saisissez, un mot de passe Wi-Fi par exemple, n'est ni envoyé ni enregistré. L'outil vous prévient quand un réglage risque de rendre le code illisible.",
      form: {
        steps: {
          type: '1. Type de contenu',
          data: '2. Contenu',
          look: '3. Apparence',
          logo: '4. Logo',
          advanced: '5. Réglages avancés',
        },
        types: {
          url: 'Lien (URL)',
          text: 'Texte',
          wifi: 'Wi-Fi',
          email: 'E-mail',
          phone: 'Téléphone',
          sms: 'SMS',
          whatsapp: 'WhatsApp',
          geo: 'Position',
          vcard: 'Contact (vCard)',
          event: 'Événement',
        },
        typeLabel: 'Type',
        fields: {
          url: ['Adresse du lien', 'https://exemple.fr/page'],
          text: ['Texte', 'Bonjour, voici mon texte'],
          ssid: ['Nom du réseau (SSID)', 'MaBox-1234'],
          wifiPassword: ['Mot de passe', 'Mot de passe du réseau'],
          security: 'Sécurité',
          hidden: 'Réseau masqué',
          emailTo: ['Destinataire', 'contact@exemple.fr'],
          emailSubject: ['Objet', 'Demande de renseignements'],
          emailBody: ['Message', 'Bonjour,'],
          phone: ['Numéro de téléphone', '+33 6 12 34 56 78'],
          message: ['Message', 'Bonjour !'],
          latitude: ['Latitude', '48.8566'],
          longitude: ['Longitude', '2.3522'],
          firstName: ['Prénom', 'Camille'],
          lastName: ['Nom', 'Martin'],
          organization: ['Organisation', 'Exemple SARL'],
          vcardEmail: ['E-mail', 'camille@exemple.fr'],
          vcardUrl: ['Site web', 'https://exemple.fr'],
          street: ['Rue', '1 rue de l’Exemple'],
          city: ['Ville', 'Paris'],
          region: ['Région', 'Île-de-France'],
          postalCode: ['Code postal', '75000'],
          country: ['Pays', 'France'],
          summary: ['Titre', 'Réunion de lancement'],
          start: ['Début', ''],
          end: ['Fin', ''],
          location: ['Lieu', 'Salle B, 2e étage'],
          description: ['Description', 'Ordre du jour…'],
        },
        securityOptions: {
          WPA: 'WPA / WPA2 / WPA3',
          WEP: 'WEP (ancien)',
          nopass: 'Aucune (réseau ouvert)',
        },
        hints: {
          phone: 'Format international avec le +, par exemple +33 6 12 34 56 78.',
          wpa3: 'WPA2 et WPA3 s’écrivent tous deux WPA : c’est le format lu par le plus grand nombre d’appareils. Le mode WPA3 seul (SAE) n’est pas lu par tous.',
          wifiSecret: 'Le mot de passe n’est ni envoyé ni enregistré, même dans ce navigateur.',
          eventTime: (zone: string) =>
            `Les heures saisies sont celles de votre navigateur (${zone}) ; le code les contient en UTC.`,
          geo: 'Degrés décimaux : latitude de −90 à 90, longitude de −180 à 180.',
          textCounter: (used: number, left: number) =>
            `${used} octet${used > 1 ? 's' : ''} · ${left} restant${left > 1 ? 's' : ''}`,
        },
        testLink: 'Tester le lien',
        errors: {
          required: 'Ce champ est obligatoire.',
          url: 'Saisissez une adresse http ou https valide, par exemple https://exemple.fr.',
          ssid: 'Indiquez le nom du réseau Wi-Fi.',
          email: 'Cette adresse e-mail n’a pas un format valide.',
          phone: 'Utilisez le format international : + puis 7 à 15 chiffres (+33 6 12 34 56 78).',
          latitude: 'La latitude doit être un nombre entre −90 et 90.',
          longitude: 'La longitude doit être un nombre entre −180 et 180.',
          name: 'Indiquez au moins un prénom ou un nom.',
          dates: 'Indiquez une date et une heure valides.',
          order: 'La fin doit être après le début.',
          capacity:
            'Le contenu est trop long pour un QR code à ce niveau de correction d’erreur. Raccourcissez-le ou choisissez un niveau plus bas.',
        },
        look: {
          preset: 'Préréglage',
          presets: {
            minimal: 'Minimaliste',
            pro: 'Professionnel',
            modern: 'Moderne',
            contrast: 'Contrasté',
            signal: 'Signal (lime)',
            custom: 'Personnalisé',
          },
          modules: 'Forme du corps',
          moduleStyles: {
            square: 'Carrés',
            soft: 'Carrés adoucis',
            rounded: 'Arrondis',
            dots: 'Points',
            leaf: 'Feuilles',
            vbars: 'Barres verticales',
            hbars: 'Barres horizontales',
          },
          outer: 'Forme du contour des marqueurs',
          outers: {
            square: 'Carré',
            rounded: 'Arrondi',
            squircle: 'Très arrondi',
            circle: 'Rond',
            leaf: 'Feuille',
            drop: 'Goutte',
            chamfer: 'Biseauté',
          },
          inner: 'Forme du centre des marqueurs',
          inners: {
            square: 'Carré',
            rounded: 'Arrondi',
            squircle: 'Très arrondi',
            circle: 'Rond',
            leaf: 'Feuille',
            drop: 'Goutte',
            chamfer: 'Biseauté',
          },
          shapeNote:
            'Seules les formes que deux décodeurs indépendants lisent dans tous nos essais sont proposées.',
          foreground: 'Couleur du code',
          background: 'Couleur du fond',
          transparent: 'Fond transparent',
          gradient: 'Dégradé',
          gradientTo: 'Seconde couleur',
          gradientAngle: 'Angle du dégradé (°)',
          margin: 'Zone de silence (modules)',
          marginHint: 'La norme demande 4 modules de marge claire autour du code.',
        },
        logo: {
          file: 'Choisir un logo',
          hint: 'PNG, JPG ou SVG, 2 Mo au plus. Le logo est traité dans votre navigateur et n’est jamais envoyé.',
          remove: 'Retirer le logo',
          size: 'Taille du logo (% du côté)',
          sizeHint: (area: number) =>
            `Le logo couvre environ ${area} % de la surface (20 % au plus pour une lecture fiable).`,
          padding: 'Marge autour du logo (modules)',
          plate: 'Fond clair derrière le logo',
          shape: 'Forme du logo',
          shapes: { square: 'Carré', rounded: 'Angles arrondis', circle: 'Rond' },
          autoLevel:
            'Avec un logo, la correction d’erreur passe automatiquement au niveau H (30 %) : le logo masque une partie du code, que la correction d’erreur doit reconstituer.',
          errors: {
            type: 'Format non pris en charge : utilisez un PNG, un JPG ou un SVG.',
            size: 'Fichier trop lourd : 2 Mo au maximum.',
            read: 'Impossible de lire cette image.',
          },
          loaded: (name: string) => `Logo chargé : ${name}`,
        },
        advanced: {
          level: 'Correction d’erreur',
          levels: { L: 'L · 7 %', M: 'M · 15 %', Q: 'Q · 25 %', H: 'H · 30 %' },
          levelHint:
            'Plus le niveau est élevé, plus le code résiste aux dégâts et aux logos, mais plus il est dense. M convient à la plupart des usages.',
          forcedH: 'Niveau H imposé par le logo.',
          filename: 'Nom du fichier',
          reset: 'Tout réinitialiser',
        },
      },
      result: {
        title: 'Aperçu',
        empty: 'Remplissez le contenu pour voir le QR code.',
        previewAlt: 'Aperçu du QR code généré',
        previewLight: 'Fond clair',
        previewDark: 'Fond sombre',
        previewBackground: 'Fond de l’aperçu',
        downloadPng: 'Télécharger en PNG',
        downloadSvg: 'Télécharger en SVG',
        resolution: 'Résolution du PNG',
        resolutionCustom: 'Autre',
        resolutionPx: 'Taille en pixels (côté)',
        resolutionHint:
          'Entre 128 et 8192 pixels. Plus la taille est grande, plus le code reste net à l’impression ou en affichage grand format.',
        resolutionUse: { 512: 'Écran', 1024: 'Document', 2048: 'Impression', 4096: 'Grand format' },
        resolutionSummary: (px: number, cm: string) =>
          `Fichier de ${px} × ${px} pixels : environ ${cm} cm de côté à 300 points par pouce.`,
        generating: 'Création du fichier…',
        exportError: 'L’export a échoué. Réessayez avec une taille plus petite.',
        generated: (modules: number, version: number, level: string) =>
          `QR code généré : ${modules} × ${modules} modules, version ${version}, correction ${level}.`,
        details: (modules: number, version: number, level: string, bytes: number) =>
          `${modules} × ${modules} modules · version ${version} · niveau ${level} · ${bytes} octet${bytes > 1 ? 's' : ''}`,
        warningsTitle: 'À vérifier avant de l’imprimer',
        noWarnings:
          'Aucun point d’attention détecté. Testez quand même avec un téléphone avant d’imprimer.',
        error: 'Erreur',
        warn: 'Attention',
        warnings: {
          contrast: (v: number) =>
            `Le contraste entre le code et le fond est de ${v}:1, en dessous de 4:1 : des téléphones auront du mal à le lire. Assombrissez le code ou éclaircissez le fond.`,
          inverted:
            'Le code est plus clair que le fond. Beaucoup de lecteurs ne lisent pas un code clair sur fond sombre : préférez un code sombre sur fond clair.',
          transparent:
            'Le fond est transparent : la lisibilité dépend de la surface sur laquelle le code sera posé (un fond clair et uni est le plus sûr).',
          logoSize: (v: number) =>
            `Le logo couvre ${v} % de la surface, au-delà des 20 % qui restent lisibles. Réduisez-le.`,
          quietZone: (v: number) =>
            `La zone de silence est de ${v} module${v > 1 ? 's' : ''}, sous les 4 recommandés : le code peut être confondu avec ce qui l’entoure.`,
          exportSize: (v: number) =>
            `À cette taille, un module fait ${v} pixel${v > 1 ? 's' : ''} : trop petit pour être net. Choisissez un export plus grand.`,
          capacity: (v: number) =>
            `Le contenu occupe ${v} % de la capacité maximale : le code sera très dense et plus difficile à lire. Raccourcissez-le si possible.`,
        },
      },
      privacy:
        'Le QR code est calculé dans votre navigateur. Ni le contenu (mot de passe Wi-Fi compris) ni le logo ne sont envoyés ou enregistrés.',
      seo: {
        whatTitle: "Ce que fait l'outil",
        what: [
          [
            'Dix types de contenu',
            'Lien, texte, Wi-Fi, e-mail, téléphone, SMS, WhatsApp, position GPS, contact (vCard) et événement de calendrier, chacun encodé au format que lisent les téléphones.',
          ],
          [
            'Un code lisible avant tout',
            'Avertissements si le contraste est faible, si les couleurs sont inversées, si le logo est trop grand, si la marge est trop courte ou si le fichier est trop petit pour la densité.',
          ],
          [
            'Formes, couleurs et logo',
            'Modules carrés, arrondis ou en points, repères carrés, arrondis ou ronds, dégradé, fond transparent, logo PNG, JPG ou SVG.',
          ],
          [
            'Export PNG et SVG',
            'PNG jusqu’à 4096 px ou SVG vectoriel, avec ou sans logo, fond transparent ou coloré.',
          ],
        ],
        howTitle: 'Comment ça marche',
        how: "Un QR code n'est pas une image mais un texte codé : chaque type de contenu suit un format précis (par exemple WIFI:T:WPA;S:nom;P:mot de passe;;). L'outil construit ce texte, le transforme en grille de modules avec correction d'erreur Reed-Solomon, puis dessine la grille en SVG avec le style choisi. Tout se passe dans votre navigateur.",
        faq: [
          [
            'Mon mot de passe Wi-Fi est-il envoyé quelque part ?',
            "Non. Le code est calculé dans votre navigateur, rien ne part sur le réseau et rien n'est enregistré, pas même dans le stockage du navigateur.",
          ],
          [
            'Quel niveau de correction d’erreur choisir ?',
            "M (15 %) convient à la plupart des cas. Avec un logo, l'outil passe automatiquement en H (30 %), car le logo masque une partie du code.",
          ],
          [
            'Pourquoi mon code personnalisé ne se lit-il pas ?',
            "Les causes les plus fréquentes sont un contraste trop faible, des couleurs inversées, un logo trop grand ou une marge trop courte. L'outil les signale ; testez toujours avec un téléphone avant d'imprimer.",
          ],
          [
            'Le QR code expire-t-il ?',
            "Non : c'est un code statique qui contient directement les données, sans serveur ni abonnement. Il fonctionne tant que le contenu (le lien, par exemple) reste valide.",
          ],
          [
            'WPA2 ou WPA3 ?',
            "Les deux s'écrivent WPA dans le code, ce qui est lu par le plus grand nombre d'appareils. Le mode WPA3 seul (SAE) n'est pas reconnu par tous les téléphones.",
          ],
        ],
      },
      related: 'Voir aussi',
      relatedLinks: [] as string[],
    },
  },
  en: {
    ui: {
      meta: {
        title: 'Free QR Code Generator: Wi-Fi, vCard, URL, Logo | Guillaume Richard',
        description:
          'Create a free QR code: Wi-Fi, link, vCard, email, SMS, WhatsApp, location, event. Colors, shapes, logo, PNG and SVG export, all in your browser.',
        appDescription:
          'Free QR code generator (URL, text, Wi-Fi, email, phone, SMS, WhatsApp, geolocation, vCard, event) with shapes, colors, gradient and logo, PNG and SVG export. No data is sent.',
      },
      name: 'QR code generator',
      card: 'QR codes for a link, Wi-Fi, vCard, event…, with shapes, colors and logo, PNG and SVG export.',
      keywords:
        'qr code generator free wifi vcard url link sms whatsapp email phone geolocation event logo png svg color',
      h1: 'QR code generator',
      intro:
        'Pick the content type, fill in the fields and download the QR code as PNG or SVG. The code is computed in your browser: what you type, a Wi-Fi password for example, is neither sent nor stored. The tool warns you when a setting could make the code unreadable.',
      form: {
        steps: {
          type: '1. Content type',
          data: '2. Content',
          look: '3. Appearance',
          logo: '4. Logo',
          advanced: '5. Advanced settings',
        },
        types: {
          url: 'Link (URL)',
          text: 'Text',
          wifi: 'Wi-Fi',
          email: 'Email',
          phone: 'Phone',
          sms: 'SMS',
          whatsapp: 'WhatsApp',
          geo: 'Location',
          vcard: 'Contact (vCard)',
          event: 'Event',
        },
        typeLabel: 'Type',
        fields: {
          url: ['Link address', 'https://example.com/page'],
          text: ['Text', 'Hello, here is my text'],
          ssid: ['Network name (SSID)', 'HomeBox-1234'],
          wifiPassword: ['Password', 'Network password'],
          security: 'Security',
          hidden: 'Hidden network',
          emailTo: ['Recipient', 'contact@example.com'],
          emailSubject: ['Subject', 'Request for information'],
          emailBody: ['Message', 'Hello,'],
          phone: ['Phone number', '+44 7700 900123'],
          message: ['Message', 'Hello!'],
          latitude: ['Latitude', '48.8566'],
          longitude: ['Longitude', '2.3522'],
          firstName: ['First name', 'Alex'],
          lastName: ['Last name', 'Smith'],
          organization: ['Organization', 'Example Ltd'],
          vcardEmail: ['Email', 'alex@example.com'],
          vcardUrl: ['Website', 'https://example.com'],
          street: ['Street', '1 Example Street'],
          city: ['City', 'London'],
          region: ['Region', 'Greater London'],
          postalCode: ['Postal code', 'SW1A 1AA'],
          country: ['Country', 'United Kingdom'],
          summary: ['Title', 'Kick-off meeting'],
          start: ['Start', ''],
          end: ['End', ''],
          location: ['Location', 'Room B, 2nd floor'],
          description: ['Description', 'Agenda…'],
        },
        securityOptions: {
          WPA: 'WPA / WPA2 / WPA3',
          WEP: 'WEP (legacy)',
          nopass: 'None (open network)',
        },
        hints: {
          phone: 'International format with the +, for example +44 7700 900123.',
          wpa3: 'WPA2 and WPA3 are both written as WPA: this is the format read by the widest range of devices. WPA3-only mode (SAE) is not read by every device.',
          wifiSecret: 'The password is neither sent nor stored, not even in this browser.',
          eventTime: (zone: string) =>
            `Times are those of your browser (${zone}); the code stores them in UTC.`,
          geo: 'Decimal degrees: latitude from −90 to 90, longitude from −180 to 180.',
          textCounter: (used: number, left: number) =>
            `${used} byte${used > 1 ? 's' : ''} · ${left} left`,
        },
        testLink: 'Test the link',
        errors: {
          required: 'This field is required.',
          url: 'Enter a valid http or https address, for example https://example.com.',
          ssid: 'Enter the Wi-Fi network name.',
          email: 'This email address is not valid.',
          phone: 'Use the international format: + then 7 to 15 digits (+44 7700 900123).',
          latitude: 'Latitude must be a number between −90 and 90.',
          longitude: 'Longitude must be a number between −180 and 180.',
          name: 'Enter at least a first name or a last name.',
          dates: 'Enter a valid date and time.',
          order: 'The end must be after the start.',
          capacity:
            'The content is too long for a QR code at this error correction level. Shorten it or choose a lower level.',
        },
        look: {
          preset: 'Preset',
          presets: {
            minimal: 'Minimal',
            pro: 'Professional',
            modern: 'Modern',
            contrast: 'High contrast',
            signal: 'Signal (lime)',
            custom: 'Custom',
          },
          modules: 'Body shape',
          moduleStyles: {
            square: 'Square',
            soft: 'Soft squares',
            rounded: 'Rounded',
            dots: 'Dots',
            leaf: 'Leaves',
            vbars: 'Vertical bars',
            hbars: 'Horizontal bars',
          },
          outer: 'Marker outline shape',
          outers: {
            square: 'Square',
            rounded: 'Rounded',
            squircle: 'Very rounded',
            circle: 'Round',
            leaf: 'Leaf',
            drop: 'Drop',
            chamfer: 'Beveled',
          },
          inner: 'Marker center shape',
          inners: {
            square: 'Square',
            rounded: 'Rounded',
            squircle: 'Very rounded',
            circle: 'Round',
            leaf: 'Leaf',
            drop: 'Drop',
            chamfer: 'Beveled',
          },
          shapeNote:
            'Only the shapes that two independent decoders read in all of our tests are offered.',
          foreground: 'Code color',
          background: 'Background color',
          transparent: 'Transparent background',
          gradient: 'Gradient',
          gradientTo: 'Second color',
          gradientAngle: 'Gradient angle (°)',
          margin: 'Quiet zone (modules)',
          marginHint: 'The standard asks for 4 modules of clear margin around the code.',
        },
        logo: {
          file: 'Choose a logo',
          hint: 'PNG, JPG or SVG, 2 MB at most. The logo is processed in your browser and never uploaded.',
          remove: 'Remove the logo',
          size: 'Logo size (% of the side)',
          sizeHint: (area: number) =>
            `The logo covers about ${area}% of the area (20% at most for reliable scanning).`,
          padding: 'Margin around the logo (modules)',
          plate: 'Light background behind the logo',
          shape: 'Logo shape',
          shapes: { square: 'Square', rounded: 'Rounded corners', circle: 'Round' },
          autoLevel:
            'With a logo, error correction automatically moves to level H (30%): the logo hides part of the code, which error correction has to rebuild.',
          errors: {
            type: 'Unsupported format: use a PNG, JPG or SVG.',
            size: 'File too large: 2 MB maximum.',
            read: 'This image could not be read.',
          },
          loaded: (name: string) => `Logo loaded: ${name}`,
        },
        advanced: {
          level: 'Error correction',
          levels: { L: 'L · 7%', M: 'M · 15%', Q: 'Q · 25%', H: 'H · 30%' },
          levelHint:
            'The higher the level, the better the code survives damage and logos, but the denser it gets. M suits most uses.',
          forcedH: 'Level H is required by the logo.',
          filename: 'File name',
          reset: 'Reset everything',
        },
      },
      result: {
        title: 'Preview',
        empty: 'Fill in the content to see the QR code.',
        previewAlt: 'Preview of the generated QR code',
        previewLight: 'Light background',
        previewDark: 'Dark background',
        previewBackground: 'Preview background',
        downloadPng: 'Download PNG',
        downloadSvg: 'Download SVG',
        resolution: 'PNG resolution',
        resolutionCustom: 'Other',
        resolutionPx: 'Size in pixels (side)',
        resolutionHint:
          'Between 128 and 8192 pixels. The larger the size, the sharper the code stays when printed or shown large.',
        resolutionUse: { 512: 'Screen', 1024: 'Document', 2048: 'Print', 4096: 'Large format' },
        resolutionSummary: (px: number, cm: string) =>
          `File of ${px} × ${px} pixels: about ${cm} cm wide at 300 dots per inch.`,
        generating: 'Creating the file…',
        exportError: 'The export failed. Try a smaller size.',
        generated: (modules: number, version: number, level: string) =>
          `QR code generated: ${modules} × ${modules} modules, version ${version}, level ${level} error correction.`,
        details: (modules: number, version: number, level: string, bytes: number) =>
          `${modules} × ${modules} modules · version ${version} · level ${level} · ${bytes} byte${bytes > 1 ? 's' : ''}`,
        warningsTitle: 'Check before printing',
        noWarnings: 'No warning detected. Still test with a phone before printing.',
        error: 'Error',
        warn: 'Warning',
        warnings: {
          contrast: (v: number) =>
            `The contrast between code and background is ${v}:1, below 4:1: some phones will struggle to read it. Darken the code or lighten the background.`,
          inverted:
            'The code is lighter than the background. Many readers cannot scan a light code on a dark background: prefer a dark code on a light background.',
          transparent:
            'The background is transparent: readability depends on the surface the code is placed on (a plain light background is safest).',
          logoSize: (v: number) =>
            `The logo covers ${v}% of the area, above the 20% that stays readable. Make it smaller.`,
          quietZone: (v: number) =>
            `The quiet zone is ${v} module${v > 1 ? 's' : ''}, below the recommended 4: the code can be confused with its surroundings.`,
          exportSize: (v: number) =>
            `At this size a module is ${v} pixel${v > 1 ? 's' : ''}: too small to be sharp. Choose a larger export.`,
          capacity: (v: number) =>
            `The content uses ${v}% of the maximum capacity: the code will be very dense and harder to scan. Shorten it if you can.`,
        },
      },
      privacy:
        'The QR code is computed in your browser. Neither the content (Wi-Fi password included) nor the logo is sent or stored.',
      seo: {
        whatTitle: 'What the tool does',
        what: [
          [
            'Ten content types',
            'Link, text, Wi-Fi, email, phone, SMS, WhatsApp, GPS location, contact (vCard) and calendar event, each encoded in the format phones read.',
          ],
          [
            'A readable code first',
            'Warnings when contrast is low, colors are inverted, the logo is too large, the margin is too short or the file is too small for the density.',
          ],
          [
            'Shapes, colors and logo',
            'Square, rounded or dot modules, square, rounded or round corner markers, gradient, transparent background, PNG, JPG or SVG logo.',
          ],
          [
            'PNG and SVG export',
            'PNG up to 4096 px or vector SVG, with or without logo, transparent or colored background.',
          ],
        ],
        howTitle: 'How it works',
        how: 'A QR code is not an image but encoded text: each content type follows a precise format (for example WIFI:T:WPA;S:name;P:password;;). The tool builds that text, turns it into a grid of modules with Reed-Solomon error correction, then draws the grid as SVG in the style you chose. Everything happens in your browser.',
        faq: [
          [
            'Is my Wi-Fi password sent anywhere?',
            'No. The code is computed in your browser, nothing leaves over the network and nothing is stored, not even in browser storage.',
          ],
          [
            'Which error correction level should I pick?',
            'M (15%) suits most cases. With a logo, the tool switches to H (30%) automatically, because the logo hides part of the code.',
          ],
          [
            'Why does my custom code not scan?',
            'The most common causes are low contrast, inverted colors, an oversized logo or a short margin. The tool flags them; always test with a phone before printing.',
          ],
          [
            'Does the QR code expire?',
            'No: it is a static code that holds the data directly, with no server or subscription. It works as long as the content (the link, for example) stays valid.',
          ],
          [
            'WPA2 or WPA3?',
            'Both are written as WPA in the code, which is read by the widest range of devices. WPA3-only mode (SAE) is not recognised by every phone.',
          ],
        ],
      },
      related: 'See also',
      relatedLinks: [] as string[],
    },
  },
};
