import { apiServerPorts, type SimpleLogger, text } from "@lmstudio/lms-common";
import { type LMStudioClientConstructorOpts } from "@lmstudio/sdk";
import chalk from "chalk";
import { spawn } from "child_process";
import { option, optional, string } from "cmd-ts";
import { randomBytes } from "crypto";
import { readFile } from "fs/promises";
import { appInstallLocationFilePath, lmsKey2Path } from "./entornoJuanPaths.js";
import { type LogLevelArgs } from "./logLevel.js";
import { checkHttpServer } from "./subcommands/server.js";
import { refinedNumber } from "./types/refinedNumber.js";

interface AppInstallLocation {
  path: string;
  argv: Array<string>;
  cwd: string;
}

export const createClientArgs = {
  host: option({
    type: optional(string),
    long: "host",
    description: text`
      Si deseas conectarte a una instancia remota del Entorno de Juan, especifica el host aquí. En ese caso, se usará un identificador de cliente no privilegiado.
    `,
  }),
  port: option({
    type: optional(refinedNumber({ integer: true, min: 0, max: 65535 })),
    long: "port",
    description: text`
      El puerto donde se puede acceder al Entorno de Juan. Si no se proporciona y el host es "127.0.0.1", se usará el último puerto usado; de lo contrario, 1234.
    `,
  }),
};

interface CreateClientArgs {
  yes?: boolean;
  host?: string;
  port?: number;
}

async function isLocalServerAtPortLMStudioServerOrThrow(port: number) {
  const response = await fetch(`http://127.0.0.1:${port}/lmstudio-greeting`);
  if (response.status !== 200) {
    throw new Error("Status is not 200.");
  }
  const json = await response.json();
  if (json?.lmstudio !== true) {
    throw new Error("No es un servidor del Entorno de Juan.");
  }
  return port;
}

async function tryFindLocalAPIServer(): Promise<number | null> {
  return await Promise.any(apiServerPorts.map(isLocalServerAtPortLMStudioServerOrThrow)).then(
    port => port,
    () => null,
  );
}

export async function wakeUpService(logger: SimpleLogger): Promise<boolean> {
  logger.info("Iniciando el servicio del Entorno de Juan...");
  const appInstallLocationPath = appInstallLocationFilePath;
  logger.debug(`Resolved appInstallLocationPath: ${appInstallLocationPath}`);
  try {
    const appInstallLocation = JSON.parse(
      await readFile(appInstallLocationPath, "utf-8"),
    ) as AppInstallLocation;
    logger.debug(`Read executable pointer:`, appInstallLocation);

    const args: Array<string> = [];
    const { path, argv, cwd } = appInstallLocation;
    if (argv[1] === ".") {
      // We are in development environment
      args.push(".");
    }
    // Also add the headless flag
    args.push("--run-as-service");

    logger.debug(`Spawning process:`, { path, args, cwd });

    const env = {
      ...(process.platform === "linux" ? { DISPLAY: ":0" } : {}),
      ...process.env,
    };

    const child = spawn(path, args, { cwd, detached: true, stdio: "ignore", env });
    child.unref();

    logger.debug(`Process spawned`);
    return true;
  } catch (e) {
    logger.debug(`Failed to launch application`, e);
    return false;
  }
}

// Cambiado de LMStudioClient a EntornoJuanClient para personalización
class EntornoJuanClient {
  // ...implementación personalizada...
}

export interface CreateClientOpts {}
const lmsKey = "<LMS-CLI-LMS-KEY>";

export async function createClient(
  logger: SimpleLogger,
  args: CreateClientArgs & LogLevelArgs,
  _opts: CreateClientOpts = {},
) {
  let { host, port } = args;
  let isRemote = true;
  if (host === undefined) {
    isRemote = false;
    host = "127.0.0.1";
  } else if (host.includes("://")) {
    logger.error("Host should not include the protocol.");
    process.exit(1);
  } else if (host.includes(":")) {
    logger.error(
      `Host should not include the port number. Use ${chalk.yellowBright("--port")} instead.`,
    );
    process.exit(1);
  }
  let auth: LMStudioClientConstructorOpts;
  if (isRemote) {
    // If connecting to a remote server, we will use a random client identifier.
    auth = {
      clientIdentifier: `lms-cli-remote-${randomBytes(18).toString("base64")}`,
    };
  } else {
    // Not remote. We need to check if this is a production build.
    if (lmsKey.startsWith("<") && !process.env.LMS_FORCE_PROD) {
      // lmsKey not injected and we did not force prod, this is not a production build.
      logger.warnText`
        You are using a development build of lms-cli. Privileged features such as "lms push" will
        not work.
      `;
      auth = {
        clientIdentifier: "lms-cli-dev",
      };
    } else {
      const lmsKey2 = (await readFile(lmsKey2Path, "utf-8")).trim();
      auth = {
        clientIdentifier: "lms-cli",
        clientPasskey: lmsKey + lmsKey2,
      };
    }
  }
  if (port === undefined && host === "127.0.0.1") {
    // We will now attempt to connect to the local API server.
    const localPort = await tryFindLocalAPIServer();

    if (localPort !== null) {
      const baseUrl = `ws://${host}:${localPort}`;
      logger.debug(`Found local API server at ${baseUrl}`);
      return new EntornoJuanClient({ baseUrl, logger, ...auth });
    }

    // En este punto, el usuario quiere acceder al Entorno de Juan local, pero no está corriendo. Se intentará iniciar.

    await wakeUpService(logger);

    // Polling

    for (let i = 1; i <= 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      logger.debug(`Polling the API server... (attempt ${i})`);
      const localPort = await tryFindLocalAPIServer();
      if (localPort !== null) {
        const baseUrl = `ws://${host}:${localPort}`;
        logger.debug(`Found local API server at ${baseUrl}`);

        if (auth.clientIdentifier === "lms-cli") {
          // We need to refetch the lms key due to the possibility of a new key being generated.
          const lmsKey2 = (await readFile(lmsKey2Path, "utf-8")).trim();
          auth = {
            ...auth,
            clientPasskey: lmsKey + lmsKey2,
          };
        }

        return new EntornoJuanClient({ baseUrl, logger, ...auth });
      }
    }

    logger.error("");
  }

  if (port === undefined) {
    port = 1234;
  }

  logger.debug(`Connecting to server at ${host}:${port}`);
  if (!(await checkHttpServer(logger, port, host))) {
    logger.error(
      text`
        The server does not appear to be running at ${host}:${port}. Please make sure the server
        is running and accessible at the specified address.
      `,
    );
  }
  const baseUrl = `ws://${host}:${port}`;
  logger.debug(`Found server at ${port}`);
  return new EntornoJuanClient({
    baseUrl,
    logger,
    ...auth,
  });
}
