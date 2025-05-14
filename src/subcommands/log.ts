import { type DiagnosticsLogEventData } from "@lmstudio/lms-shared-types";
import chalk from "chalk";
import { command, flag, subcommands } from "cmd-ts";
import { createClient, createClientArgs } from "../createClient.js";
import { createLogger, logLevelArgs } from "../logLevel.js";

const stream = command({
  name: "stream",
  description: "Transmite logs desde el Entorno de Juan",
  args: {
    json: flag({
      long: "json",
      description: "Outputs in JSON format, separated by newline",
    }),
    ...logLevelArgs,
    ...createClientArgs,
  },
  async handler(args) {
    const logger = createLogger(args);
    const client = await createClient(logger, args);
    const { json } = args;

    logger.info("Transmitiendo logs desde el Entorno de Juan\n");

    client.diagnostics.unstable_streamLogs(log => {
      if (json) {
        console.log(JSON.stringify(log));
      } else {
        console.log("timestamp: " + chalk.greenBright(new Date(log.timestamp).toLocaleString()));
        console.log("type: " + chalk.greenBright(log.data.type));
        switch (log.data.type) {
          case "llm.prediction.input": {
            printLlmPredictionLogEvent(log.data);
          }
        }
        console.log();
        console.log();
      }
    });
  },
});

function printLlmPredictionLogEvent(
  data: DiagnosticsLogEventData & { type: "llm.prediction.input" },
) {
  console.log("modelIdentifier: " + chalk.greenBright(data.modelIdentifier));
  console.log("modelPath: " + chalk.greenBright(data.modelPath));
  console.log(`input: "${chalk.green(data.input)}"`);
}

export const log = subcommands({
  name: "log",
  description:
    "Operaciones de log. Actualmente solo soporta transmitir logs desde el Entorno de Juan vía `lms log stream`",
  cmds: {
    stream,
  },
});
