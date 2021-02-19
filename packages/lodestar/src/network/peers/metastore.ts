import {IBeaconConfig} from "@chainsafe/lodestar-config";
import PeerId from "peer-id";
import {phase0} from "@chainsafe/lodestar-types";
import {BasicType, ContainerType} from "@chainsafe/ssz";
import {notNullish} from "../../util/notNullish";
import {ReqRespEncoding} from "../../constants";

/**
 * Get/set data about peers.
 */
export interface IPeerMetadataStore {
  encoding: PeerStoreBucket<ReqRespEncoding>;
  metadata: PeerStoreBucket<phase0.Metadata>;
  rpcScore: PeerStoreBucket<number>;
  status: PeerStoreBucket<phase0.Status>;
}

export type PeerStoreBucket<T> = {
  set: (peer: PeerId, value: T) => void;
  get: (peer: PeerId) => T | undefined;
};

/**
 * Wrapper around Libp2p.peerstore.metabook
 * that uses ssz serialization to store data
 */
export class Libp2pPeerMetadataStore implements IPeerMetadataStore {
  encoding: PeerStoreBucket<ReqRespEncoding>;
  metadata: PeerStoreBucket<phase0.Metadata>;
  rpcScore: PeerStoreBucket<number>;
  status: PeerStoreBucket<phase0.Status>;

  private readonly config: IBeaconConfig;
  private readonly metabook: MetadataBook;

  constructor(config: IBeaconConfig, metabook: MetadataBook) {
    this.config = config;
    this.metabook = metabook;
    this.encoding = this.typedStore("encoding", new StringType());
    this.metadata = this.typedStore("metadata", this.config.types.phase0.Metadata);
    this.rpcScore = this.typedStore("score", this.config.types.Number64);
    this.status = this.typedStore("status", this.config.types.phase0.Status);
  }

  private typedStore<T>(key: string, type: BasicType<T> | ContainerType<T>): PeerStoreBucket<T> {
    return {
      set: (peer: PeerId, value: T): void => {
        if (notNullish(value)) {
          this.metabook.set(peer, key, Buffer.from(type.serialize(value)));
        } else {
          this.metabook.deleteValue(peer, key);
        }
      },
      get: (peer: PeerId): T | undefined => {
        const value = this.metabook.getValue(peer, key);
        if (value) {
          return type.deserialize(value);
        }
      },
    };
  }
}

/**
 * Dedicated string type only used here, so not worth to keep it in `lodestar-types`
 */
class StringType<T extends string> extends BasicType<T> {
  serialize(value: T): Uint8Array {
    return Buffer.from(value);
  }

  deserialize(data: Uint8Array): T {
    return (Buffer.from(data).toString() as unknown) as T;
  }
}
