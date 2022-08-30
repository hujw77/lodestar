import fs from "node:fs";
import {Keystore} from "@chainsafe/bls-keystore";
import {YargsError, ICliCommand, getPubkeyHexFromKeystore} from "../../util/index.js";
import {IGlobalArgs} from "../../options/index.js";
import {validatorOptions, IValidatorCliArgs} from "./options.js";
import {getAccountPaths} from "./paths.js";
import {importKeystoreDefinitionsFromExternalDir, readPassphraseOrPrompt} from "./signers/importExternalKeystores.js";
import {PersistedKeysBackend} from "./keymanager/persistedKeys.js";

/* eslint-disable no-console */

export const importCmd: ICliCommand<IValidatorCliArgs, IGlobalArgs> = {
  command: "import",

  describe:
    "Imports one or more EIP-2335 keystores into a Lodestar validator client directory, \
requesting passwords interactively. The directory flag provides a convenient \
method for importing a directory of keys generated by the eth2-deposit-cli \
Ethereum Foundation utility.",

  examples: [
    {
      command: "validator import --network goerli --keystores $HOME/eth2.0-deposit-cli/validator_keys",
      description: "Import validator keystores generated with the Ethereum Foundation Staking Launchpad",
    },
  ],

  // Note: re-uses `--importKeystores` and `--importKeystoresPassword` from root validator command options

  options: {
    ...validatorOptions,

    importKeystores: {
      ...validatorOptions.importKeystores,
      requiresArg: true,
    },
  },

  handler: async (args) => {
    // This command takes: importKeystores, importKeystoresPassword
    //
    // - recursively finds keystores in importKeystores
    // - validates keystores can decrypt
    // - writes them in persisted form - do not lock

    if (!args.importKeystores) {
      throw new YargsError("Must set importKeystores");
    }

    // Collect same password for all keystores
    // If importKeystoresPassword is not provided, interactive prompt for it

    const keystoreDefinitions = importKeystoreDefinitionsFromExternalDir({
      keystoresPath: args.importKeystores,
      password: await readPassphraseOrPrompt(args),
    });

    if (keystoreDefinitions.length === 0) {
      throw new YargsError("No keystores found");
    }

    console.log(
      `Importing ${keystoreDefinitions.length} keystores:\n ${keystoreDefinitions
        .map((def) => def.keystorePath)
        .join("\n")}`
    );

    const accountPaths = getAccountPaths(args);
    const persistedKeystoresBackend = new PersistedKeysBackend(accountPaths);
    let importedCount = 0;

    for (const {keystorePath, password} of keystoreDefinitions) {
      const keystoreStr = fs.readFileSync(keystorePath, "utf8");
      const keystore = Keystore.parse(keystoreStr);
      const pubkeyHex = getPubkeyHexFromKeystore(keystore);

      // Check if keystore can decrypt
      if (!(await keystore.verifyPassword(password))) {
        throw Error(`Invalid password for keystore ${keystorePath}`);
      }

      const didImportKey = persistedKeystoresBackend.writeKeystore({
        keystoreStr,
        password,
        // Not used immediately
        lockBeforeWrite: false,
        // Return duplicate status if already found
        persistIfDuplicate: false,
      });

      if (didImportKey) {
        console.log(`Imported keystore ${pubkeyHex} ${keystorePath}`);
        importedCount++;
      } else {
        console.log(`Duplicate keystore ${pubkeyHex} ${keystorePath}`);
      }
    }

    console.log(`\nSuccessfully imported ${importedCount}/${keystoreDefinitions.length} keystores`);

    console.log(`
  DO NOT USE THE ORIGINAL KEYSTORES TO VALIDATE WITH
  ANOTHER CLIENT, OR YOU WILL GET SLASHED.
  `);
  },
};
