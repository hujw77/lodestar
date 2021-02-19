import {SinonSandbox, SinonStubbedInstance} from "sinon";
import {phase0} from "@chainsafe/lodestar-types";
import {LevelDbController} from "@chainsafe/lodestar-db";

import {BeaconDb} from "../../../src/db";
import {
  AggregateAndProofRepository,
  AttestationRepository,
  AttesterSlashingRepository,
  BadBlockRepository,
  BlockArchiveRepository,
  BlockRepository,
  DepositEventRepository,
  DepositDataRootRepository,
  Eth1DataRepository,
  ProposerSlashingRepository,
  StateArchiveRepository,
  VoluntaryExitRepository,
} from "../../../src/db/api/beacon/repositories";
import {SeenAttestationCache} from "../../../src/db/api/beacon/seenAttestationCache";
import {minimalConfig} from "@chainsafe/lodestar-config/minimal";
import {PendingBlockRepository} from "../../../src/db/api/beacon/repositories/pendingBlock";

export class StubbedBeaconDb extends BeaconDb {
  public db!: SinonStubbedInstance<LevelDbController>;

  public badBlock: SinonStubbedInstance<BadBlockRepository> & BadBlockRepository;
  public block: SinonStubbedInstance<BlockRepository> & BlockRepository;
  public pendingBlock: SinonStubbedInstance<PendingBlockRepository> & PendingBlockRepository;
  public blockArchive: SinonStubbedInstance<BlockArchiveRepository> & BlockArchiveRepository;
  public stateArchive: SinonStubbedInstance<StateArchiveRepository> & StateArchiveRepository;

  public attestation: SinonStubbedInstance<AttestationRepository> & AttestationRepository;
  public aggregateAndProof: SinonStubbedInstance<AggregateAndProofRepository> & AggregateAndProofRepository;
  public voluntaryExit: SinonStubbedInstance<VoluntaryExitRepository> & VoluntaryExitRepository;
  public proposerSlashing: SinonStubbedInstance<ProposerSlashingRepository> & ProposerSlashingRepository;
  public attesterSlashing: SinonStubbedInstance<AttesterSlashingRepository> & AttesterSlashingRepository;
  public depositEvent: SinonStubbedInstance<DepositEventRepository> & DepositEventRepository;

  public depositDataRoot: SinonStubbedInstance<DepositDataRootRepository> & DepositDataRootRepository;
  public eth1Data: SinonStubbedInstance<Eth1DataRepository> & Eth1DataRepository;

  public seenAttestationCache: SinonStubbedInstance<SeenAttestationCache> & SeenAttestationCache;

  public processBlockOperations: SinonStubbedInstance<(signedBlock: phase0.SignedBeaconBlock) => Promise<void>> &
    ((signedBlock: phase0.SignedBeaconBlock) => Promise<void>);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(sinon: SinonSandbox, config = minimalConfig) {
    super({config, controller: null!});
    this.badBlock = sinon.createStubInstance(BadBlockRepository) as any;
    this.block = sinon.createStubInstance(BlockRepository) as any;
    this.pendingBlock = sinon.createStubInstance(PendingBlockRepository) as any;
    this.blockArchive = sinon.createStubInstance(BlockArchiveRepository) as any;
    this.stateArchive = sinon.createStubInstance(StateArchiveRepository) as any;

    this.attestation = sinon.createStubInstance(AttestationRepository) as any;
    this.aggregateAndProof = sinon.createStubInstance(AggregateAndProofRepository) as any;
    this.voluntaryExit = sinon.createStubInstance(VoluntaryExitRepository) as any;
    this.proposerSlashing = sinon.createStubInstance(ProposerSlashingRepository) as any;
    this.attesterSlashing = sinon.createStubInstance(AttesterSlashingRepository) as any;
    this.depositEvent = sinon.createStubInstance(DepositEventRepository) as any;

    this.depositDataRoot = sinon.createStubInstance(DepositDataRootRepository) as any;
    this.eth1Data = sinon.createStubInstance(Eth1DataRepository) as any;
    this.seenAttestationCache = sinon.createStubInstance(SeenAttestationCache) as any;
    this.processBlockOperations = sinon.stub(this, "processBlockOperations") as any;
  }
}
