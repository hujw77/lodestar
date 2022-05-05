import {ValueOf} from "@chainsafe/ssz";
import * as ssz from "./sszTypes";

export type AttestationSubnets = ValueOf<typeof ssz.AttestationSubnets>;
export type BeaconBlockHeader = ValueOf<typeof ssz.BeaconBlockHeader>;
export type BeaconBlockHeaderBn = ValueOf<typeof ssz.BeaconBlockHeaderBn>;
export type SignedBeaconBlockHeader = ValueOf<typeof ssz.SignedBeaconBlockHeader>;
export type SignedBeaconBlockHeaderBn = ValueOf<typeof ssz.SignedBeaconBlockHeaderBn>;
export type Checkpoint = ValueOf<typeof ssz.Checkpoint>;
export type DepositMessage = ValueOf<typeof ssz.DepositMessage>;
export type DepositData = ValueOf<typeof ssz.DepositData>;
export type DepositEvent = ValueOf<typeof ssz.DepositEvent>;
export type Eth1Data = ValueOf<typeof ssz.Eth1Data>;
export type Eth1DataOrdered = ValueOf<typeof ssz.Eth1DataOrdered>;
export type Eth1Block = ValueOf<typeof ssz.Eth1Block>;
export type Fork = ValueOf<typeof ssz.Fork>;
export type ForkData = ValueOf<typeof ssz.ForkData>;
export type ENRForkID = ValueOf<typeof ssz.ENRForkID>;
export type HistoricalBatch = ValueOf<typeof ssz.HistoricalBatch>;
export type Validator = ValueOf<typeof ssz.Validator>;
export type AttestationData = ValueOf<typeof ssz.AttestationData>;
export type AttestationDataBn = ValueOf<typeof ssz.AttestationDataBn>;
export type IndexedAttestation = ValueOf<typeof ssz.IndexedAttestation>;
export type IndexedAttestationBn = ValueOf<typeof ssz.IndexedAttestationBn>;
export type PendingAttestation = ValueOf<typeof ssz.PendingAttestation>;
export type SigningData = ValueOf<typeof ssz.SigningData>;
export type Attestation = ValueOf<typeof ssz.Attestation>;
export type AttesterSlashing = ValueOf<typeof ssz.AttesterSlashing>;
export type Deposit = ValueOf<typeof ssz.Deposit>;
export type ProposerSlashing = ValueOf<typeof ssz.ProposerSlashing>;
export type VoluntaryExit = ValueOf<typeof ssz.VoluntaryExit>;
export type SignedVoluntaryExit = ValueOf<typeof ssz.SignedVoluntaryExit>;
export type BeaconBlockBody = ValueOf<typeof ssz.BeaconBlockBody>;
export type BeaconBlock = ValueOf<typeof ssz.BeaconBlock>;
export type SignedBeaconBlock = ValueOf<typeof ssz.SignedBeaconBlock>;
export type BeaconState = ValueOf<typeof ssz.BeaconState>;
export type CommitteeAssignment = ValueOf<typeof ssz.CommitteeAssignment>;
export type AggregateAndProof = ValueOf<typeof ssz.AggregateAndProof>;
export type SignedAggregateAndProof = ValueOf<typeof ssz.SignedAggregateAndProof>;
export type Status = ValueOf<typeof ssz.Status>;
export type Goodbye = ValueOf<typeof ssz.Goodbye>;
export type Ping = ValueOf<typeof ssz.Ping>;
export type Metadata = ValueOf<typeof ssz.Metadata>;
export type BeaconBlocksByRangeRequest = ValueOf<typeof ssz.BeaconBlocksByRangeRequest>;
export type BeaconBlocksByRootRequest = ValueOf<typeof ssz.BeaconBlocksByRootRequest>;
export type Genesis = ValueOf<typeof ssz.Genesis>;
