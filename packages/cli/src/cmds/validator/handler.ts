import {LevelDbController} from "@chainsafe/lodestar-db";
import {SlashingProtection, Validator} from "@chainsafe/lodestar-validator";
import {SignerType, SignerLocal, SignerRemote, Signer} from "@chainsafe/lodestar-validator";
import {getMetrics, MetricsRegister} from "@chainsafe/lodestar-validator";
import {KeymanagerServer, KeymanagerApi, readRemoteSignerDefinitions} from "@chainsafe/lodestar-keymanager-server";
import {SignerDefinition} from "@chainsafe/lodestar-api/keymanager";
import {RegistryMetricCreator, collectNodeJSMetrics, HttpMetricsServer} from "@chainsafe/lodestar";
import {ILogger} from "@chainsafe/lodestar-utils";
import {getBeaconConfigFromArgs} from "../../config/index.js";
import {IGlobalArgs} from "../../options/index.js";
import {YargsError, getDefaultGraffiti, mkdir, getCliLogger} from "../../util/index.js";
import {onGracefulShutdown, parseFeeRecipient} from "../../util/index.js";
import {getVersionData} from "../../util/version.js";
import {getBeaconPaths} from "../beacon/paths.js";
import {getValidatorPaths} from "./paths.js";
import {IValidatorCliArgs, validatorMetricsDefaultOptions, defaultDefaultFeeRecipient} from "./options.js";
import {getLocalSecretKeys, getExternalSigners, groupExternalSignersByUrl} from "./keys.js";

/**
 * Runs a validator client.
 */
export async function validatorHandler(args: IValidatorCliArgs & IGlobalArgs): Promise<void> {
  const graffiti = args.graffiti || getDefaultGraffiti();
  const defaultFeeRecipient = parseFeeRecipient(args.defaultFeeRecipient ?? defaultDefaultFeeRecipient);

  const validatorPaths = getValidatorPaths(args);
  const beaconPaths = getBeaconPaths(args);
  const config = getBeaconConfigFromArgs(args);

  const logger = getCliLogger(args, beaconPaths, config);

  const {version, commit} = getVersionData();
  logger.info("Lodestar", {network: args.network, version, commit});

  const dbPath = validatorPaths.validatorsDbDir;
  mkdir(dbPath);

  const onGracefulShutdownCbs: (() => Promise<void> | void)[] = [];
  onGracefulShutdown(async () => {
    for (const cb of onGracefulShutdownCbs) await cb();
  }, logger.info.bind(logger));

  // A validator signer is an item capable of producing signatures. Two types exist:
  // - Local: a secret key capable of signing
  // - Remote: a URL that supports EIP-3030 (BLS Remote Signer HTTP API)
  //
  // Local secret keys can be gathered from:
  // - Local keystores existant on disk
  // - Local keystores imported via keymanager api
  // - Derived from a mnemonic (TESTING ONLY)
  // - Derived from interop keys (TESTING ONLY)
  //
  // Remote signers need to pre-declare the list of pubkeys to validate with
  // - Via CLI argument
  // - Fetched directly from remote signer API
  // - Remote signer definition imported from keymanager api
  //
  // Questions:
  // - Where to persist keystores imported via remote signer API?
  // - Where to persist remote signer definitions imported by API?
  // - Is it necessary to know the origin of a file? If it was imported or there already?
  // - How to handle the locks?
  const importedRemoteSignersDirpath = "";
  const importedKeystoresDirpath = "";

  const signers: Signer[] = [];

  // Read remote keys
  const externalSigners = await getExternalSigners(args);
  if (externalSigners.length > 0) {
    for (const {externalSignerUrl, pubkeyHex} of externalSigners) {
      signers.push({type: SignerType.Remote, pubkeyHex: pubkeyHex, externalSignerUrl});
    }
  }

  // Read local keys
  else {
    const {secretKeys, unlockSecretKeys} = await getLocalSecretKeys(args);
    for (const secretKey of secretKeys) {
      signers.push({type: SignerType.Local, secretKey});
    }

    if (unlockSecretKeys) {
      onGracefulShutdownCbs.push(unlockSecretKeys);
    }

    const remoteSigners: SignerDefinition[] = readRemoteSignerDefinitions(firstImportKeystorePath);
    for (const remoteSigner of remoteSigners) {
      signers.push({type: SignerType.Remote, pubkeyHex: remoteSigner.pubkey, externalSignerUrl: remoteSigner.url});
    }
  }

  // Ensure the validator has at least one key
  if (signers.length === 0) {
    throw new YargsError("No signers found with current args");
  }

  logSigners(logger, signers);

  // This AbortController interrupts the sleep() calls when waiting for genesis
  const controller = new AbortController();
  onGracefulShutdownCbs.push(async () => controller.abort());

  const dbOps = {
    config,
    controller: new LevelDbController({name: dbPath}, {logger}),
  };
  const slashingProtection = new SlashingProtection(dbOps);

  // Create metrics registry if metrics are enabled
  // Send version and network data for static registries

  const register = args["metrics.enabled"] ? new RegistryMetricCreator() : null;
  const metrics =
    register && getMetrics((register as unknown) as MetricsRegister, {version, commit, network: args.network});

  // Start metrics server if metrics are enabled.
  // Collect NodeJS metrics defined in the Lodestar repo

  if (metrics) {
    collectNodeJSMetrics(register);

    const port = args["metrics.port"] ?? validatorMetricsDefaultOptions.port;
    const address = args["metrics.address"] ?? validatorMetricsDefaultOptions.address;
    const metricsServer = new HttpMetricsServer({port, address}, {register, logger});

    onGracefulShutdownCbs.push(() => metricsServer.stop());
    await metricsServer.start();
  }

  // This promise resolves once genesis is available.
  // It will wait for genesis, so this promise can be potentially very long

  const validator = await Validator.initializeFromBeaconNode(
    {
      dbOps,
      slashingProtection,
      api: args.server,
      logger,
      signers,
      graffiti,
      afterBlockDelaySlotFraction: args.afterBlockDelaySlotFraction,
      defaultFeeRecipient,
    },
    controller.signal,
    metrics
  );

  onGracefulShutdownCbs.push(() => validator.stop());
  await validator.start();

  // Start keymanager API backend
  // Only if keymanagerEnabled flag is set to true
  if (args.keymanagerEnabled) {
    if (!args.importKeystoresPath || args.importKeystoresPath.length === 0) {
      throw new YargsError("For keymanagerEnabled must set importKeystoresPath to at least 1 path");
    }

    // Use the first path in importKeystoresPath as directory to write keystores
    // KeymanagerApi must ensure that the path is a directory and not a file
    const firstImportKeystorePath = args.importKeystoresPath[0];

    const keymanagerApi = new KeymanagerApi(validator, {
      importedKeystoresDirpath,
      importedRemoteSignersDirpath,
    });

    const keymanagerServer = new KeymanagerServer(
      {
        host: args.keymanagerHost,
        port: args.keymanagerPort,
        cors: args.keymanagerCors,
        isAuthEnabled: args.keymanagerAuthEnabled,
        tokenDir: dbPath,
      },
      {config, logger, api: keymanagerApi}
    );
    onGracefulShutdownCbs.push(() => keymanagerServer.close());
    await keymanagerServer.listen();
  }
}

/**
 * Log each pubkeys for auditing out keys are loaded from the logs
 */
function logSigners(logger: ILogger, signers: Signer[]): void {
  const localSigners: SignerLocal[] = [];
  const remoteSigners: SignerRemote[] = [];

  for (const signer of signers) {
    switch (signer.type) {
      case SignerType.Local:
        localSigners.push(signer);
        break;
      case SignerType.Remote:
        remoteSigners.push(signer);
        break;
    }
  }

  if (localSigners.length > 0) {
    logger.info(`Decrypted ${localSigners.length} local keystores`);
    for (const signer of localSigners) {
      logger.info(signer.secretKey.toPublicKey().toHex());
    }
  }

  for (const {externalSignerUrl, pubkeysHex} of groupExternalSignersByUrl(remoteSigners)) {
    logger.info(`External signers on URL: ${externalSignerUrl}`);
    for (const pubkeyHex of pubkeysHex) {
      logger.info(pubkeyHex);
    }
  }
}
