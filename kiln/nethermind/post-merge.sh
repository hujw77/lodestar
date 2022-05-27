#!/bin/bash -x

scriptDir=$(dirname $0)
currentDir=$(pwd)

. $scriptDir/common-setup.sh

cd $EL_BINARY_DIR
dotnet run -c Release -- --config themerge_kiln_testvectors --Merge.TerminalTotalDifficulty $TTD --JsonRpc.JwtSecretFile $currentDir/$DATA_DIR/jwtsecret --JsonRpc.Enabled true --JsonRpc.Host 0.0.0.0 --JsonRpc.AdditionalRpcUrls "http://localhost:$ETH_PORT|http|net;eth;subscribe;engine;web3;client|no-auth,http://localhost:$ENGINE_PORT|http|eth;engine"
