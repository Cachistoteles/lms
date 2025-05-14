import { join } from "path";

// Encuentra la carpeta base del Entorno de Juan (antes LMStudio)
function findEntornoJuanHome() {
  // Aquí puedes personalizar la lógica para tu entorno
  // Por defecto, usa la carpeta HOME del usuario
  return process.env.ENTORNO_JUAN_HOME || require("os").homedir();
}

const entornoJuanHome = findEntornoJuanHome();
export const pluginsFolderPath = join(entornoJuanHome, "extensions", "plugins");
export const lmsKey2Path = join(entornoJuanHome, ".internal", "lms-key-2");
export const cliPrefPath = join(entornoJuanHome, ".internal", "cli-pref.json");
export const defaultModelsFolder = join(entornoJuanHome, "models");
export const serverCtlPath = join(entornoJuanHome, ".internal", "http-server-ctl.json");
export const serverConfigPath = join(entornoJuanHome, ".internal", "http-server-config.json");

export default {
  entornoJuanHome,
  pluginsFolderPath,
  lmsKey2Path,
  cliPrefPath,
  defaultModelsFolder,
  serverCtlPath,
  serverConfigPath,
};
