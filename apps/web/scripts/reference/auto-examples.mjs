// Exemples et descriptions générés pour les commandes GAM du wiki qui n'ont pas (encore) d'exemple écrit à la main.
//
// - syntheticExamples(syn) : construit de vrais exemples à partir de la ligne de syntaxe du wiki (« gam create user <EmailAddress> … ») :
//   1) la forme minimale (seulement les mots obligatoires), 2) la même avec une option courante, quand toutes ses valeurs sont connues.
//   Les valeurs viennent d'un jeu fictif (example.com). Un paramètre inconnu reste écrit <Comme ceci> : il faut alors le remplir.
// - describe(name, lang) : description courte « verbe + objet » (« Exporter en CSV la liste des utilisateurs »), pour la recherche.
// Tout est déterministe : même entrée, même sortie (le build doit rester reproductible).

// ---------------------------------------------------------------------------------------------
// Valeurs d'exemple
// ---------------------------------------------------------------------------------------------
const USER = 'alice.martin@example.com';
const GROUP = 'equipe-compta@example.com';
const FILE_ID = '1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW';

/** [motif du nom du paramètre (sans <>, en minuscules), valeur]. Le premier motif qui correspond gagne. */
const SAMPLES = [
  [/^usertypeentity$|^userentity$|^usertypeentitya$/, `user ${USER}`],
  [/^group(type)?entity$/, `group ${GROUP}`],
  [/^crostypeentity$|^croentity$/, 'cros_sn 5CD0123ABC'],
  [
    /^useritem$|^useremail$|^emailaddress$|^email$|^primaryemail$|^useritemlist|^emailaddresslist$/,
    USER,
  ],
  [/^(group|cigroup)(item|email|key)$|^groupemail/, GROUP],
  [/^orgunit(item|path)?$|^orgunitpath$|^ouitem$|^orgunitentity$/, '"/Comptabilite"'],
  [/^(drive)?fileid$|^drivefileid$|^fileid$/, FILE_ID],
  [/^driveFileEntity$/i, `id:${FILE_ID}`],
  [/^drivefileitem$/, `id:${FILE_ID}`],
  [/^drivefolderid$|^folderid$|^drivefolderidentifier$/, '1FoLdErId0123456789AbCdEfGhIjKlM'],
  [/^shareddriveid|^teamdriveid/, '0AExampleSharedDriveId'],
  [/^shareddrivename|^teamdrivename/, '"Projets"'],
  [/^calendar(item|id|email)$/, USER],
  [/^calendarname$/, '"Planning equipe"'],
  [/^domain(name|item)?$|^domainnamelist$/, 'example.com'],
  [/^customerid$/, 'C01abcd23'],
  [/^(file|csvfile|csv)name$|^filepath$|^localfile$|^file$|^csvfileselector$/, './fichier.csv'],
  [/^(folder|dir|directory)(name|path)?$|^targetfolder$|^drivedir$/, './export'],
  [/^(date|startdate|enddate)$/, '2026-01-31'],
  [/^(time|datetime|starttime|endtime)$/, '2026-01-31T09:00:00'],
  [/^(timezone)$/, 'Europe/Paris'],
  [/^(boolean|bool)$/, 'true'],
  [/^(number|integer|int)$/, '10'],
  [/^(language|languagecode)$/, 'fr'],
  [/^(role|aclrole)$/, 'reader'],
  [/^(subject)$/, '"Information"'],
  [/^(message|body)$/, '"Bonjour, ceci est un exemple."'],
  [/^(password)$/, '"MotDePasse-2026!"'],
  [/^(firstname|givenname)$/, 'Alice'],
  [/^(lastname|familyname)$/, 'Martin'],
  [/^(name|displayname|title|string|text|description)$/, '"Exemple"'],
  [/^(query|searchquery)$/, '"is:unread"'],
  [/^(label|labelname)$/, '"A traiter"'],
  [/^(phone)$/, '"+33102030405"'],
  [/^(url)$/, 'https://example.com'],
  [/^(sku|skuid)$/, '1010020020'],
  [/^(productid)$/, 'Google-Apps'],
  [/^(courseid|courseitem)$/, '123456789'],
  [/^(alias)$/, 'a.martin@example.com'],
  [/^(schemaname)$/, 'InfosRH'],
  [/^(fieldname)$/, 'Matricule'],
  [/^(courseid|courseidlist)$/, '123456789'],
  [/^(mobileid|resourceid|deviceid|crosid)$/, 'ID_APPAREIL'],
];

const sampleFor = (raw) => {
  const key = raw.replace(/[*+]$/, '').toLowerCase();
  for (const [re, value] of SAMPLES) if (re.test(key)) return value;
  return null;
};

// ---------------------------------------------------------------------------------------------
// Découpage de la syntaxe
// ---------------------------------------------------------------------------------------------
/** Sépare une syntaxe en jetons de premier niveau (les crochets, parenthèses et chevrons restent entiers). */
function splitTop(text) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if ('[(<{'.includes(ch)) depth++;
    if (']>)}'.includes(ch)) depth = Math.max(0, depth - 1);
    if (/\s/.test(ch) && depth === 0) {
      if (cur) out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** Sépare sur « | » au premier niveau seulement. */
function splitAlt(text) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if ('[(<{'.includes(ch)) depth++;
    if (']>)}'.includes(ch)) depth = Math.max(0, depth - 1);
    if (ch === '|' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Simplifie un jeton obligatoire ; renvoie un tableau de mots (peut être vide) ou null si le jeton est inutilisable. */
function required(token) {
  if (!token || token === '...') return [];
  if (token.startsWith('[')) return []; // facultatif
  // alternatives : on garde la première
  const alts = splitAlt(token);
  let first = alts[0];
  if (first.startsWith('(') && first.endsWith(')') && !/\)\s*\S/.test(first.slice(0, -1) + '')) {
    const inner = first.slice(1, -1).replace(/\)[*+]?$/, '');
    const words = splitTop(inner).flatMap((t) => required(t) ?? []);
    return words;
  }
  first = first.replace(/^\(|\)[*+]?$/g, '');
  const m = first.match(/^<([^<>]+)>[*+]?$/);
  if (m) {
    const value = sampleFor(m[1]);
    return [value ?? `<${m[1]}>`];
  }
  if (/^[a-z0-9_\-:./@]+$/i.test(first)) return [first];
  if (first.includes('<')) {
    // « id:<DriveFileID> », « user <x> » collé : on remplace chaque <…> connu
    return [first.replace(/<([^<>]+)>[*+]?/g, (_all, name) => sampleFor(name) ?? `<${name}>`)];
  }
  return [first];
}

/** Option facultative simple : « [mot <Valeur>] » ou « [mot] » dont toutes les valeurs sont connues, sinon null. */
function simpleOption(token) {
  if (!token.startsWith('[') || !token.endsWith(']')) return null;
  const inner = token.slice(1, -1);
  if (/[[\]()]/.test(inner.replace(/<[^>]*>/g, ''))) return null; // imbriqué : trop incertain
  const words = [];
  for (const t of splitTop(inner)) {
    const first = splitAlt(t)[0];
    const m = first.match(/^<([^<>]+)>[*+]?$/);
    if (m) {
      const v = sampleFor(m[1]);
      if (v === null) return null;
      words.push(v);
    } else if (/^[a-z0-9_-]+$/i.test(first)) words.push(first);
    else return null;
  }
  // une option qui ne contient que des valeurs sans mot-clé n'a pas de sens seule
  if (!words.length || !/^[a-z]/i.test(words[0])) return null;
  return words;
}

/** Renvoie jusqu'à deux exemples concrets pour une ligne de syntaxe GAM (tableau vide si la ligne n'est pas une commande). */
export function syntheticExamples(syn) {
  const line = String(syn ?? '')
    .split('\n')[0]
    .trim();
  if (!/^gam\s/.test(line)) return [];
  const tokens = splitTop(line);
  const base = [];
  for (const [i, t] of tokens.entries()) {
    // « gam <UserItem> … » : l'adresse seule n'est pas une commande valide, il faut « gam user <adresse> … »
    if (i === 1 && /^<(UserItem|EmailAddress)>$/.test(t)) base.push('user', USER);
    else base.push(...(required(t) ?? []));
  }
  if (base.length < 2) return [];
  const minimal = base.join(' ');
  const out = [minimal];
  // exemple 2 : la première option simple (todrive, csv, query…), placée à la fin de la commande
  for (const t of tokens) {
    const opt = simpleOption(t);
    if (opt) {
      const withOption = `${minimal} ${opt.join(' ')}`;
      if (withOption !== minimal && !/\b(delete|wipe|purge)\b/.test(minimal)) out.push(withOption);
      break;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Descriptions « verbe + objet »
// ---------------------------------------------------------------------------------------------
// [clés (mots de la commande), nom fr, genre, pluriel fr, nom en, pluriel en]
const NOUNS = [
  ['user users', 'utilisateur', 'm', 'utilisateurs', 'user', 'users'],
  ['group groups', 'groupe', 'm', 'groupes', 'group', 'groups'],
  [
    'cigroup cigroups',
    'groupe Cloud Identity',
    'm',
    'groupes Cloud Identity',
    'Cloud Identity group',
    'Cloud Identity groups',
  ],
  [
    'member members group-members cigroup-members cimember',
    'membre de groupe',
    'm',
    'membres de groupes',
    'group member',
    'group members',
  ],
  ['alias aliases', 'alias', 'm', 'alias', 'alias', 'aliases'],
  [
    'org orgs ou ous orgtree',
    'unité d’organisation',
    'f',
    'unités d’organisation',
    'organizational unit',
    'organizational units',
  ],
  [
    'label labels labellist labelid labelsettings',
    'étiquette Gmail',
    'f',
    'étiquettes Gmail',
    'Gmail label',
    'Gmail labels',
  ],
  ['filter filters', 'filtre Gmail', 'm', 'filtres Gmail', 'Gmail filter', 'Gmail filters'],
  [
    'forward forwardingaddress forwardingaddresses',
    'transfert de messagerie',
    'm',
    'transferts de messagerie',
    'mail forwarding',
    'mail forwarding settings',
  ],
  [
    'delegate delegates',
    'délégué de boîte mail',
    'm',
    'délégués de boîte mail',
    'mailbox delegate',
    'mailbox delegates',
  ],
  [
    'sendas',
    'adresse d’expédition (« envoyer en tant que »)',
    'f',
    'adresses d’expédition',
    'send-as address',
    'send-as addresses',
  ],
  [
    'signature',
    'signature de messagerie',
    'f',
    'signatures de messagerie',
    'email signature',
    'email signatures',
  ],
  [
    'vacation',
    'réponse automatique d’absence',
    'f',
    'réponses automatiques d’absence',
    'vacation auto-reply',
    'vacation auto-replies',
  ],
  [
    'imap pop language',
    'réglage de messagerie',
    'm',
    'réglages de messagerie',
    'mail setting',
    'mail settings',
  ],
  [
    'message messages thread threads draft',
    'message Gmail',
    'm',
    'messages Gmail',
    'Gmail message',
    'Gmail messages',
  ],
  [
    'smime smimes',
    'certificat S/MIME',
    'm',
    'certificats S/MIME',
    'S/MIME certificate',
    'S/MIME certificates',
  ],
  [
    'photo profilephoto contactphotos',
    'photo de profil',
    'f',
    'photos de profil',
    'profile photo',
    'profile photos',
  ],
  [
    'drivefile file files drivefileshortcut',
    'fichier Drive',
    'm',
    'fichiers Drive',
    'Drive file',
    'Drive files',
  ],
  [
    'filelist filetree fileinfo filecounts filesharecounts filerevisions fileparenttree filepath filecomments',
    'fichier Drive',
    'm',
    'fichiers Drive',
    'Drive file',
    'Drive files',
  ],
  [
    'drivefileacl drivefileacls permissions',
    'droit de partage Drive',
    'm',
    'droits de partage Drive',
    'Drive sharing permission',
    'Drive sharing permissions',
  ],
  [
    'drivefolderpath emptydrivefolders orphans',
    'dossier Drive',
    'm',
    'dossiers Drive',
    'Drive folder',
    'Drive folders',
  ],
  [
    'drivetrash drivelastmodification diskusage drivesettings driveactivity drivelabels filedrivelabels',
    'élément Drive',
    'm',
    'éléments Drive',
    'Drive item',
    'Drive items',
  ],
  [
    'shareddrive shareddrives shareddriveinfo oushareddrives shareddrivethemes shareddriveorganizers teamdrive teamdrives',
    'lecteur partagé',
    'm',
    'lecteurs partagés',
    'shared drive',
    'shared drives',
  ],
  [
    'shareddriveacls',
    'droit de partage de lecteur partagé',
    'm',
    'droits de partage de lecteurs partagés',
    'shared drive permission',
    'shared drive permissions',
  ],
  [
    'ownership',
    'propriété de fichiers',
    'f',
    'propriétés de fichiers',
    'file ownership',
    'file ownerships',
  ],
  [
    'calendar calendars calsettings calendartrash',
    'agenda',
    'm',
    'agendas',
    'calendar',
    'calendars',
  ],
  [
    'calendaracls calendaracl',
    'droit d’accès à un agenda',
    'm',
    'droits d’accès aux agendas',
    'calendar access rule',
    'calendar access rules',
  ],
  [
    'event events calattendees',
    'événement d’agenda',
    'm',
    'événements d’agenda',
    'calendar event',
    'calendar events',
  ],
  [
    'focustime outofoffice workinglocation',
    'statut d’agenda',
    'm',
    'statuts d’agenda',
    'calendar status',
    'calendar statuses',
  ],
  [
    'resource resources',
    'ressource d’agenda (salle, matériel)',
    'f',
    'ressources d’agenda',
    'calendar resource',
    'calendar resources',
  ],
  ['building buildings', 'bâtiment', 'm', 'bâtiments', 'building', 'buildings'],
  [
    'feature features',
    'équipement de ressource',
    'm',
    'équipements de ressources',
    'resource feature',
    'resource features',
  ],
  [
    'course courses',
    'cours Classroom',
    'm',
    'cours Classroom',
    'Classroom course',
    'Classroom courses',
  ],
  [
    'course-participants course-studentgroups course-studentgroup course-studentgroup-members course-studentgroupmembers',
    'participant ou groupe de classe',
    'm',
    'participants et groupes de classe',
    'class participant or group',
    'class participants and groups',
  ],
  [
    'course-announcements course-materials course-topics course-work course-submissions course-counts coursecounts',
    'contenu de cours Classroom',
    'm',
    'contenus de cours Classroom',
    'Classroom course content',
    'Classroom course content',
  ],
  [
    'guardian guardians guardianinvitation classroominvitation classroominvitations classroomprofile',
    'responsable d’élève',
    'm',
    'responsables d’élèves',
    'guardian',
    'guardians',
  ],
  [
    'license licenses licenseskus license_skus configlicenseskus',
    'licence',
    'f',
    'licences',
    'license',
    'licenses',
  ],
  [
    'schema schemas',
    'schéma de champs personnalisés',
    'm',
    'schémas de champs personnalisés',
    'custom user schema',
    'custom user schemas',
  ],
  [
    'cros cros_ous crosactivity crostelemetry crosqueries cros_ou',
    'appareil Chrome OS',
    'm',
    'appareils Chrome OS',
    'Chrome OS device',
    'Chrome OS devices',
  ],
  [
    'mobile device devices deviceuser deviceusers deviceuserstate',
    'appareil mobile',
    'm',
    'appareils mobiles',
    'mobile device',
    'mobile devices',
  ],
  [
    'chromepolicy chromepolicies policy policies chromeschema chromeschemas chromepolicyimage',
    'stratégie Chrome',
    'f',
    'stratégies Chrome',
    'Chrome policy',
    'Chrome policies',
  ],
  [
    'chromehistory chromeapps chromeappdevices chromeneedsattn chromeversions chromeaues chromedevicecounts chromenetwork chromeapp chromesnvalidity',
    'rapport Chrome',
    'm',
    'rapports Chrome',
    'Chrome report',
    'Chrome reports',
  ],
  [
    'chromeprofile chromeprofiles chromeprofilecommand chromeprofilecommands browser browsers browsertoken browsertokens',
    'navigateur Chrome géré',
    'm',
    'navigateurs Chrome gérés',
    'managed Chrome browser',
    'managed Chrome browsers',
  ],
  ['printer printers printermodels', 'imprimante', 'f', 'imprimantes', 'printer', 'printers'],
  [
    'vaultmatter vaultmatters',
    'dossier Vault',
    'm',
    'dossiers Vault',
    'Vault matter',
    'Vault matters',
  ],
  [
    'vaulthold vaultholds',
    'conservation Vault',
    'f',
    'conservations Vault',
    'Vault hold',
    'Vault holds',
  ],
  [
    'vaultexport vaultexports',
    'export Vault',
    'm',
    'exports Vault',
    'Vault export',
    'Vault exports',
  ],
  [
    'vaultquery vaultqueries vaultcounts',
    'recherche Vault',
    'f',
    'recherches Vault',
    'Vault query',
    'Vault queries',
  ],
  [
    'datatransfer datatransfers',
    'transfert de données',
    'm',
    'transferts de données',
    'data transfer',
    'data transfers',
  ],
  [
    'domain domains domainalias domainaliases verify',
    'domaine',
    'm',
    'domaines',
    'domain',
    'domains',
  ],
  [
    'admin admins adminrole adminroles privileges',
    'administrateur ou rôle d’administration',
    'm',
    'administrateurs et rôles d’administration',
    'administrator or admin role',
    'administrators and admin roles',
  ],
  [
    'token tokens asps asp backupcodes',
    'jeton ou mot de passe d’application',
    'm',
    'jetons et mots de passe d’application',
    'token or app password',
    'tokens and app passwords',
  ],
  [
    'alert alerts alertfeedback alertsettings',
    'alerte de sécurité',
    'f',
    'alertes de sécurité',
    'security alert',
    'security alerts',
  ],
  [
    'project projects svcacct svcaccts serviceaccount sakey sakeys currentprojectid',
    'projet ou compte de service GAM',
    'm',
    'projets et comptes de service GAM',
    'GAM project or service account',
    'GAM projects and service accounts',
  ],
  [
    'customer customers customer_id resoldcustomer resoldsubscription resoldsubscriptions channelcustomers channelcustomerentitlements channeloffers channelproducts channelskus',
    'client ou abonnement revendeur',
    'm',
    'clients et abonnements revendeur',
    'reseller customer or subscription',
    'reseller customers and subscriptions',
  ],
  [
    'contact contacts contactgroup contactgroups domaincontacts otherContacts othercontacts contactdelegate contactdelegates',
    'contact',
    'm',
    'contacts',
    'contact',
    'contacts',
  ],
  [
    'peopleprofile domainprofiles',
    'profil de personne',
    'm',
    'profils de personnes',
    'people profile',
    'people profiles',
  ],
  [
    'sheet sheetrange sheetranges gsheet',
    'feuille de calcul Google Sheets',
    'f',
    'feuilles de calcul Google Sheets',
    'Google Sheets spreadsheet',
    'Google Sheets spreadsheets',
  ],
  [
    'document documents form forms formresponses',
    'document ou formulaire Google',
    'm',
    'documents et formulaires Google',
    'Google document or form',
    'Google documents and forms',
  ],
  [
    'task tasks tasklist tasklists',
    'tâche Google Tasks',
    'f',
    'tâches Google Tasks',
    'Google Tasks task',
    'Google Tasks tasks',
  ],
  [
    'note notes noteacl noteattachments',
    'note Google Keep',
    'f',
    'notes Google Keep',
    'Google Keep note',
    'Google Keep notes',
  ],
  [
    'chatspace chatspaces chatspacedm chatmember chatmembers chatmessage chatmessages chatevent chatevents chatsearchmessages chatemoji chatemojis chatsection chatsections chatsectionitem chatsectionitems chatavailability',
    'espace Google Chat',
    'm',
    'espaces Google Chat',
    'Google Chat space',
    'Google Chat spaces',
  ],
  [
    'meetspace meetconference meetconferences meetparticipants meetrecordings meettranscripts',
    'réunion Google Meet',
    'f',
    'réunions Google Meet',
    'Google Meet meeting',
    'Google Meet meetings',
  ],
  [
    'cseidentity cseidentities csekeypair csekeypairs',
    'configuration du chiffrement côté client',
    'f',
    'configurations du chiffrement côté client',
    'client-side encryption setting',
    'client-side encryption settings',
  ],
  [
    'inboundssoprofile inboundssoprofiles inboundssocredential inboundssocredentials inboundssoassignment inboundssoassignments',
    'configuration SSO entrant',
    'f',
    'configurations SSO entrant',
    'inbound SSO setting',
    'inbound SSO settings',
  ],
  [
    'caalevel caalevels allowlisteddomain allowlisteddomains datastudioassets datastudiopermissions',
    'réglage de sécurité de l’organisation',
    'm',
    'réglages de sécurité de l’organisation',
    'organization security setting',
    'organization security settings',
  ],
  [
    'userinvitation userinvitations isinvitable guestuser',
    'invitation d’utilisateur',
    'f',
    'invitations d’utilisateurs',
    'user invitation',
    'user invitations',
  ],
  [
    'youtubechannels',
    'chaîne YouTube',
    'f',
    'chaînes YouTube',
    'YouTube channel',
    'YouTube channels',
  ],
  [
    'storagebucket storagefile',
    'stockage Cloud Storage',
    'm',
    'stockages Cloud Storage',
    'Cloud Storage item',
    'Cloud Storage items',
  ],
  [
    'analyticaccounts analyticaccountsummaries analyticproperties analyticdatastreams businessprofileaccounts tagmanageraccounts tagmanagercontainers tagmanagerworkspaces tagmanagertags tagmanagerpermissions webresources webmastersites',
    'élément Google Analytics ou Tag Manager',
    'm',
    'éléments Google Analytics et Tag Manager',
    'Google Analytics or Tag Manager item',
    'Google Analytics and Tag Manager items',
  ],
  [
    'gcpfolder',
    'dossier Google Cloud',
    'm',
    'dossiers Google Cloud',
    'Google Cloud folder',
    'Google Cloud folders',
  ],
  ['grouptree orgtree', 'arborescence', 'f', 'arborescences', 'tree', 'trees'],
  [
    'usage',
    'rapport d’utilisation',
    'm',
    'rapports d’utilisation',
    'usage report',
    'usage reports',
  ],
  [
    'addresses',
    'adresse (utilisateur ou groupe)',
    'f',
    'adresses (utilisateurs et groupes)',
    'address (user or group)',
    'addresses (users and groups)',
  ],
  [
    'sendemail sendreply send',
    'e-mail envoyé',
    'm',
    'e-mails envoyés',
    'sent email',
    'sent emails',
  ],
  [
    'instance info',
    'instance du domaine',
    'f',
    'informations du domaine',
    'domain instance',
    'domain information',
  ],
];

const VERBS = {
  print: [(n) => `Exporter en CSV la liste des ${n.pl}`, (n) => `Export ${n.plEn} as CSV`],
  show: [(n) => `Afficher les ${n.pl}`, (n) => `Show ${n.plEn}`],
  info: [
    (n) => `Afficher le détail ${n.g === 'f' ? 'd’une' : 'd’un'} ${n.n}`,
    (n) => `Show the details of a ${n.nEn}`,
  ],
  create: [(n) => `Créer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Create a ${n.nEn}`],
  add: [(n) => `Ajouter ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Add a ${n.nEn}`],
  update: [(n) => `Modifier ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Update a ${n.nEn}`],
  modify: [(n) => `Modifier ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Modify a ${n.nEn}`],
  delete: [(n) => `Supprimer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Delete a ${n.nEn}`],
  del: [(n) => `Supprimer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Delete a ${n.nEn}`],
  remove: [(n) => `Retirer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Remove a ${n.nEn}`],
  clear: [(n) => `Vider les ${n.pl}`, (n) => `Clear ${n.plEn}`],
  copy: [(n) => `Copier ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Copy a ${n.nEn}`],
  move: [(n) => `Déplacer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Move a ${n.nEn}`],
  sync: [(n) => `Synchroniser les ${n.pl}`, (n) => `Synchronize ${n.plEn}`],
  get: [(n) => `Récupérer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Get a ${n.nEn}`],
  download: [
    (n) => `Télécharger ${n.g === 'f' ? 'une' : 'un'} ${n.n}`,
    (n) => `Download a ${n.nEn}`,
  ],
  upload: [(n) => `Envoyer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Upload a ${n.nEn}`],
  empty: [(n) => `Vider les ${n.pl}`, (n) => `Empty ${n.plEn}`],
  transfer: [
    (n) => `Transférer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`,
    (n) => `Transfer a ${n.nEn}`,
  ],
  undelete: [
    (n) => `Restaurer ${n.g === 'f' ? 'une' : 'un'} ${n.n} supprimé${n.g === 'f' ? 'e' : ''}`,
    (n) => `Restore a deleted ${n.nEn}`,
  ],
  suspend: [(n) => `Suspendre ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Suspend a ${n.nEn}`],
  unsuspend: [
    (n) => `Réactiver ${n.g === 'f' ? 'une' : 'un'} ${n.n}`,
    (n) => `Reactivate a ${n.nEn}`,
  ],
  check: [(n) => `Vérifier ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Check a ${n.nEn}`],
  import: [(n) => `Importer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Import a ${n.nEn}`],
  export: [(n) => `Exporter ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Export a ${n.nEn}`],
  archive: [(n) => `Archiver ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Archive a ${n.nEn}`],
  claim: [
    (n) => `Prendre la propriété de ${n.g === 'f' ? 'une' : 'un'} ${n.n}`,
    (n) => `Claim a ${n.nEn}`,
  ],
  purge: [
    (n) => `Supprimer définitivement ${n.g === 'f' ? 'une' : 'un'} ${n.n}`,
    (n) => `Permanently delete a ${n.nEn}`,
  ],
  trash: [
    (n) => `Mettre à la corbeille ${n.g === 'f' ? 'une' : 'un'} ${n.n}`,
    (n) => `Move a ${n.nEn} to the trash`,
  ],
  untrash: [
    (n) => `Sortir de la corbeille ${n.g === 'f' ? 'une' : 'un'} ${n.n}`,
    (n) => `Restore a ${n.nEn} from the trash`,
  ],
  wipe: [
    (n) => `Effacer à distance ${n.g === 'f' ? 'une' : 'un'} ${n.n}`,
    (n) => `Wipe a ${n.nEn}`,
  ],
  approve: [(n) => `Approuver ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Approve a ${n.nEn}`],
  block: [(n) => `Bloquer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Block a ${n.nEn}`],
  cancel: [(n) => `Annuler ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Cancel a ${n.nEn}`],
  accept: [(n) => `Accepter ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Accept a ${n.nEn}`],
  rotate: [(n) => `Renouveler ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Rotate a ${n.nEn}`],
  use: [(n) => `Utiliser ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Use a ${n.nEn}`],
  replace: [(n) => `Remplacer ${n.g === 'f' ? 'une' : 'un'} ${n.n}`, (n) => `Replace a ${n.nEn}`],
  list: [(n) => `Lister les ${n.pl}`, (n) => `List ${n.plEn}`],
  report: [(n) => `Rapport sur les ${n.pl}`, (n) => `Report on ${n.plEn}`],
};

const NOUN_INDEX = new Map();
for (const [keys, n, g, pl, nEn, plEn] of NOUNS)
  for (const k of keys.split(/\s+/))
    if (!NOUN_INDEX.has(k.toLowerCase())) NOUN_INDEX.set(k.toLowerCase(), { n, g, pl, nEn, plEn });

/** Description courte d'une commande « gam … » d'après son nom ; null si le verbe ou l'objet est inconnu. */
export function describe(name, lang = 'fr') {
  let t = splitTop(
    String(name ?? '')
      .split(String.fromCharCode(10))[0]
      .trim(),
  ).slice(1);
  // « gam redirect csv ./fichier.csv [multiprocess] print … » : on décrit la commande redirigée
  if (t[0] === 'redirect' && t.length > 3) {
    t = t.slice(3);
    while (
      /^(multiprocess|append|noheader|charset|todrive|timestampcolumn|translate)$/i.test(t[0] ?? '')
    )
      t = t.slice(1);
  }
  if (!t.length) return null;
  const head = t[0].split('|')[0].toLowerCase();
  const GENERIC = {
    config: ['Régler une option de configuration de GAM', 'Set a GAM configuration option'],
    oauth: ['Gérer l’autorisation OAuth de GAM', 'Manage GAM’s OAuth authorization'],
    oauth2: ['Gérer l’autorisation OAuth de GAM', 'Manage GAM’s OAuth authorization'],
    version: [
      'Afficher la version de GAM et vérifier les mises à jour',
      'Show the GAM version and check for updates',
    ],
    redirect: ['Rediriger la sortie de GAM vers un fichier', 'Redirect GAM output to a file'],
    select: ['Choisir une section de configuration GAM', 'Select a GAM configuration section'],
    csv: [
      'Exécuter une commande GAM pour chaque ligne d’un fichier CSV',
      'Run a GAM command for each row of a CSV file',
    ],
    loop: [
      'Exécuter une commande GAM pour chaque ligne d’un fichier CSV',
      'Run a GAM command for each row of a CSV file',
    ],
    batch: [
      'Exécuter un lot de commandes GAM depuis un fichier',
      'Run a batch of GAM commands from a file',
    ],
    tbatch: [
      'Exécuter un lot de commandes GAM depuis un fichier',
      'Run a batch of GAM commands from a file',
    ],
    csvkmd: [
      'Exécuter des commandes GAM par clé d’un fichier CSV',
      'Run GAM commands by key from a CSV file',
    ],
    whatis: [
      'Savoir à quoi correspond une adresse (utilisateur, groupe, alias)',
      'Find out what an address is (user, group, alias)',
    ],
    ou: [
      'Agir sur les utilisateurs d’une unité d’organisation',
      'Act on the users of an organizational unit',
    ],
  };
  if (GENERIC[head] && !(head === 'redirect' && t.length > 3))
    return GENERIC[head][lang === 'fr' ? 0 : 1];
  let who = '';
  if (t[0].startsWith('<')) {
    who = t[0];
    t = t.slice(1);
  } else if (/^users?$/.test(t[0]) && t[1] && !/^(print|show|info)$/.test(t[1])) {
    who = '<UserTypeEntity>';
    t = t.slice(2);
  }
  if (t.length < 2) return null;
  const verb = t[0].split('|')[0].toLowerCase();
  const object = t[1].split('|')[0].toLowerCase();
  const v = VERBS[verb];
  const n = NOUN_INDEX.get(object);
  if (!v || !n) return null;
  const text = v[lang === 'fr' ? 0 : 1](n);
  if (!who) return text;
  const suffix =
    lang === 'fr'
      ? /CrOS/i.test(who)
        ? ' (appareils Chrome)'
        : /User/i.test(who)
          ? ' (pour un ou plusieurs utilisateurs)'
          : ''
      : /CrOS/i.test(who)
        ? ' (Chrome devices)'
        : /User/i.test(who)
          ? ' (for one or more users)'
          : '';
  return text + suffix;
}
