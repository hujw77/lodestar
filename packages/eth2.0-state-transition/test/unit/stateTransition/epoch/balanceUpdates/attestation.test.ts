import BN from "bn.js";
import {expect} from "chai";
import sinon from "sinon";

import {config} from "@chainsafe/eth2.0-config/lib/presets/mainnet";
import * as utilsEpoch from "../../../../../../eth2.0-state-transition/src/epoch/util";
import * as utils from "../../../../../../eth2.0-state-transition/src/util";
import * as baseReward
  from "../../../../../../eth2.0-state-transition/src/epoch/balanceUpdates/baseReward";

import {generateState} from "../../../../utils/state";
import {generateValidators} from "../../../../utils/validator";
import {getAttestationDeltas}
  from "../../../../../../eth2.0-state-transition/src/epoch/balanceUpdates/attestation";
import {generateEmptyAttestation} from "../../../../utils/attestation";


describe('process epoch - balance updates', function () {

  const sandbox = sinon.createSandbox();

  let getAttestingBalanceStub: any,
    getMatchingHeadAttestationsStub: any,
    getMatchingSourceAttestationsStub: any,
    getMatchingTargetAttestationsStub: any,
    getTotalActiveBalanceStub: any,
    getUnslashedAttestingIndicesStub: any,
    getBaseRewardStub: any,
    getAttestingIndicesStub: any,
    getPreviousEpochStub: any,
    isActiveValidatorStub: any;

  beforeEach(() => {
    getAttestingBalanceStub = sandbox.stub(utilsEpoch, "getAttestingBalance");
    getMatchingHeadAttestationsStub = sandbox.stub(utilsEpoch, "getMatchingHeadAttestations");
    getMatchingSourceAttestationsStub = sandbox.stub(utilsEpoch, "getMatchingSourceAttestations");
    getMatchingTargetAttestationsStub = sandbox.stub(utilsEpoch, "getMatchingTargetAttestations");
    getTotalActiveBalanceStub = sandbox.stub(utils, "getTotalActiveBalance");
    getUnslashedAttestingIndicesStub = sandbox.stub(utilsEpoch, "getUnslashedAttestingIndices");
    getBaseRewardStub = sandbox.stub(baseReward, "getBaseReward");
    getAttestingIndicesStub = sandbox.stub(utils, "getAttestingIndices");
    getPreviousEpochStub = sandbox.stub(utils, "getPreviousEpoch");
    isActiveValidatorStub = sandbox.stub(utils, "isActiveValidator");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return rewards', function () {
    const state  = generateState();
    state.validators = generateValidators(2);
    getPreviousEpochStub.returns(5);
    getTotalActiveBalanceStub.returns(new BN(32));
    isActiveValidatorStub.returns(true);
    getAttestingBalanceStub.returns(new BN(10));
    const emptyPendingAttestation = [
      {
        ...generateEmptyAttestation(),
        inclusionDelay: 10,
        proposerIndex: 1
      }
    ];
    getUnslashedAttestingIndicesStub.returns([0, 1]);
    getMatchingSourceAttestationsStub.returns(emptyPendingAttestation);
    getMatchingTargetAttestationsStub.returns(emptyPendingAttestation);
    getMatchingHeadAttestationsStub.returns(emptyPendingAttestation);
    getBaseRewardStub.returns(new BN(10));
    getAttestingIndicesStub.returns([0, 1]);

    try {
      const result  = getAttestationDeltas(config, state);
      const rewards = result[0];
      const penalties = result[1];
      rewards.forEach((value)=>{
        expect(value.gt(new BN(0))).to.be.true;
      });
    }catch (e) {
      expect.fail(e.stack);
    }

  });

  it('should return penalties', function () {
    const state  = generateState();
    state.validators = generateValidators(4);
    getPreviousEpochStub.returns(5);
    getTotalActiveBalanceStub.returns(new BN(100));
    isActiveValidatorStub.returns(true);
    getAttestingBalanceStub.returns(new BN(2));
    const emptyPendingAttestation = [
      {
        ...generateEmptyAttestation(),
        inclusionDelay: 10,
        proposerIndex: 1
      }
    ];
    getUnslashedAttestingIndicesStub.returns([2, 3]);
    getMatchingSourceAttestationsStub.returns(emptyPendingAttestation);
    getMatchingTargetAttestationsStub.returns(emptyPendingAttestation);
    getMatchingHeadAttestationsStub.returns(emptyPendingAttestation);
    getBaseRewardStub.returns(new BN(2));
    getAttestingIndicesStub.returns([2, 3]);
    try {
      const result  = getAttestationDeltas(config, state);
      const rewards = result[0];
      const penalties = result[1];
      penalties.forEach((value)=>{
        expect(value.gt(new BN(0))).to.be.true;
      });
    }catch (e) {
      expect.fail(e.stack);
    }
  });

});
