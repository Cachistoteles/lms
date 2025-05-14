import { makePromise, makeTitledPrettyError, text, type SimpleLogger } from "@lmstudio/lms-common";
// Sustituido LMStudioClient por EntornoJuanClient (interfaz genérica para tu entorno)
import { type EntornoJuanClient } from "@lmstudio/sdk";
import chalk from "chalk";

export async function ensureAuthenticated(
  client: EntornoJuanClient,
  logger: SimpleLogger,
  { yes = false }: { yes?: boolean } = {},
) {
  const { promise, resolve, reject } = makePromise<void>();
  client.repository
    .ensureAuthenticated({
      onAuthenticationUrl: url => {
        if (yes) {
          reject(
            makeTitledPrettyError(
              "Authentication required",
              text`
                This operation requires you to be authenticated. Inline authentication disabled due
                to ${chalk.yellowBright("--yes")} flag. Please use ${chalk.yellowBright("lms auth")}
                to authenticate before running this command again.
              `,
              url,
            ),
          );
        } else {
          logger.info("Authentication required. Please visit the following URL to authenticate:");
          logger.info();
          logger.info(chalk.greenBright(`    ${url}`));
          logger.info();
        }
      },
    })
    .then(resolve, reject);

  await promise;
}
