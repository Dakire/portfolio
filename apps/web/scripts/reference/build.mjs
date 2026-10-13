// pnpm reference:build : régénère les index JSON de la section « Référence » à partir des sources YAML.
import { computeOutputs, writeOutputs } from './lib.mjs';

const outputs = computeOutputs();
writeOutputs(outputs);
console.log(
  `Référence : ${Object.keys(outputs).length} fichier(s) écrit(s) dans public/data/reference/.`,
);
