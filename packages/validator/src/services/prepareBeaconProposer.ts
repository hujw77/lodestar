import {Epoch, bellatrix} from "@chainsafe/lodestar-types";
import {Api, routes} from "@chainsafe/lodestar-api";
import {IBeaconConfig} from "@chainsafe/lodestar-config";
import {fromHexString} from "@chainsafe/ssz";
import {SLOTS_PER_EPOCH} from "@chainsafe/lodestar-params";
import {IClock, ILoggerVc} from "../util/index.js";
import {Metrics} from "../metrics.js";
import {ValidatorStore} from "./validatorStore.js";
import {IndicesService} from "./indices.js";

/**
 * This service is responsible for updating the BNs and/or Mev relays with
 * the corresponding feeRecipient suggestion. This should ideally run per epoch
 * but can be run per slot. Lighthouse also uses this to trigger any block
 */
export class PrepareBeaconProposerService {
  constructor(
    private readonly config: IBeaconConfig,
    private readonly logger: ILoggerVc,
    private readonly api: Api,
    private clock: IClock,
    private readonly validatorStore: ValidatorStore,
    private readonly indicesService: IndicesService,
    private readonly metrics: Metrics | null
  ) {
    clock.runEveryEpoch(this.prepareBeaconProposer);
    clock.runEveryEpoch(this.registerValidator);
  }

  private prepareBeaconProposer = async (epoch: Epoch): Promise<void> => {
    if (epoch < this.config.BELLATRIX_FORK_EPOCH - 1) return;

    await Promise.all([
      // Run prepareBeaconProposer immediately for all known local indices
      this.api.validator
        .prepareBeaconProposer(this.getProposerData(this.indicesService.getAllLocalIndices()))
        .catch((e: Error) => {
          this.logger.error("Error on prepareBeaconProposer", {epoch}, e);
        }),

      // At the same time fetch any remaining unknown validator indices, then poll duties for those newIndices only
      this.indicesService
        .pollValidatorIndices()
        .then((newIndices) => this.api.validator.prepareBeaconProposer(this.getProposerData(newIndices)))
        .catch((e: Error) => {
          this.logger.error("Error on poll indices and prepareBeaconProposer", {epoch}, e);
        }),
    ]);
  };

  private getProposerData(indices: number[]): routes.validator.ProposerPreparationData[] {
    return indices.map((validatorIndex) => ({
      validatorIndex: validatorIndex.toString(),
      feeRecipient: this.validatorStore.feeRecipientByValidatorPubkey.getOrDefault(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.indicesService.index2pubkey.get(validatorIndex)!
      ),
    }));
  }

  private registerValidator = async (epoch: Epoch): Promise<void> => {
    if (epoch < this.config.BELLATRIX_FORK_EPOCH - 1) return;
    if (epoch > 0) return;
    this.getValidatorRegistrations(epoch, this.indicesService.getAllLocalIndices())
      .then((registrations) => this.api.validator.registerValidator(registrations))
      .catch((e: Error) => {
        this.logger.error("Error on registerValidator", {epoch}, e);
      });

    // At the same time fetch any remaining unknown validator indices, then poll duties for those newIndices only
    this.indicesService
      .pollValidatorIndices()
      .then((newIndices) =>
        this.getValidatorRegistrations(epoch, newIndices).then((registrations) =>
          this.api.validator.registerValidator(registrations)
        )
      )
      .catch((e: Error) => {
        this.logger.error("Error on poll indices and prepareBeaconProposer", {epoch}, e);
      });
  };

  private getValidatorRegistrations = async (
    epoch: Epoch,
    indices: number[]
  ): Promise<bellatrix.SignedValidatorRegistrationV1[]> => {
    const slot = epoch * SLOTS_PER_EPOCH;
    return Promise.all(
      indices.map((validatorIndex) => {
        const pubkeyHex = this.indicesService.index2pubkey.get(validatorIndex);
        if (!pubkeyHex) throw Error(`Pubkey lookup failure for validatorIndex=${validatorIndex}`);
        const feeRecipient = this.validatorStore.feeRecipientByValidatorPubkey.getOrDefault(pubkeyHex);
        const gasLimit = 10000;
        return this.validatorStore.signValidatorRegistration(
          fromHexString(pubkeyHex),
          fromHexString(feeRecipient),
          gasLimit,
          slot
        );
      })
    );
  };
}
