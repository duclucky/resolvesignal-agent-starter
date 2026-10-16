export declare const budgetVaultAbi: readonly [{
    readonly type: "function";
    readonly name: "token";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly type: "function";
    readonly name: "deposit";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "setPaused";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "value";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "depositCap";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "maxCommitmentAmount";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "maxConcurrentCommitments";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "activeCommitments";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "isProviderAllowed";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "grantId";
        readonly type: "bytes32";
    }, {
        readonly name: "provider";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "isEvaluatorAllowed";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "grantId";
        readonly type: "bytes32";
    }, {
        readonly name: "evaluator";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "ledger";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "deposited";
            readonly type: "uint256";
        }, {
            readonly name: "available";
            readonly type: "uint256";
        }, {
            readonly name: "reserved";
            readonly type: "uint256";
        }, {
            readonly name: "inEscrow";
            readonly type: "uint256";
        }, {
            readonly name: "settled";
            readonly type: "uint256";
        }, {
            readonly name: "withdrawn";
            readonly type: "uint256";
        }];
    }];
}, {
    readonly type: "function";
    readonly name: "reservations";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "grantId";
            readonly type: "bytes32";
        }, {
            readonly name: "provider";
            readonly type: "address";
        }, {
            readonly name: "evaluator";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "jobExpiresAt";
            readonly type: "uint256";
        }, {
            readonly name: "workHash";
            readonly type: "bytes32";
        }, {
            readonly name: "termsHash";
            readonly type: "bytes32";
        }, {
            readonly name: "status";
            readonly type: "uint8";
        }];
    }];
}, {
    readonly type: "function";
    readonly name: "createGrant";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "grantId";
        readonly type: "bytes32";
    }, {
        readonly name: "parentId";
        readonly type: "bytes32";
    }, {
        readonly name: "grantee";
        readonly type: "address";
    }, {
        readonly name: "cap";
        readonly type: "uint256";
    }, {
        readonly name: "expiresAt";
        readonly type: "uint256";
    }, {
        readonly name: "providers";
        readonly type: "address[]";
    }, {
        readonly name: "evaluators";
        readonly type: "address[]";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "revokeGrant";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "grantId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "reserve";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "input";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "grantId";
            readonly type: "bytes32";
        }, {
            readonly name: "operationId";
            readonly type: "bytes32";
        }, {
            readonly name: "provider";
            readonly type: "address";
        }, {
            readonly name: "evaluator";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "adapter";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "quoteExpiresAt";
            readonly type: "uint256";
        }, {
            readonly name: "jobExpiresAt";
            readonly type: "uint256";
        }, {
            readonly name: "workHash";
            readonly type: "bytes32";
        }, {
            readonly name: "nonce";
            readonly type: "bytes32";
        }];
    }, {
        readonly name: "providerSignature";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
    }];
}, {
    readonly type: "function";
    readonly name: "cancelReservation";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "withdrawAvailable";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "recipient";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}];
export declare const erc20Abi: readonly [{
    readonly type: "function";
    readonly name: "balanceOf";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "decimals";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint8";
    }];
}, {
    readonly type: "function";
    readonly name: "approve";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}];
export declare const adapterAbi: readonly [{
    readonly type: "function";
    readonly name: "jobs";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "commitmentId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "dispatch";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "commitmentId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "fund";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "commitmentId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "reconcile";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "commitmentId";
        readonly type: "bytes32";
    }];
    readonly outputs: readonly [];
}];
export declare const agenticCommerceAbi: readonly [{
    readonly type: "function";
    readonly name: "getJob";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly name: "client";
            readonly type: "address";
        }, {
            readonly name: "provider";
            readonly type: "address";
        }, {
            readonly name: "evaluator";
            readonly type: "address";
        }, {
            readonly name: "description";
            readonly type: "string";
        }, {
            readonly name: "budget";
            readonly type: "uint256";
        }, {
            readonly name: "expiredAt";
            readonly type: "uint256";
        }, {
            readonly name: "status";
            readonly type: "uint8";
        }, {
            readonly name: "hook";
            readonly type: "address";
        }];
    }];
}, {
    readonly type: "function";
    readonly name: "setBudget";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "submit";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "deliverable";
        readonly type: "bytes32";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "complete";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "reason";
        readonly type: "bytes32";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "reject";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "reason";
        readonly type: "bytes32";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "claimRefund";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}];
export declare const agenticCommerceDraftAbi: readonly [{
    readonly type: "function";
    readonly name: "getJob";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly name: "client";
            readonly type: "address";
        }, {
            readonly name: "provider";
            readonly type: "address";
        }, {
            readonly name: "evaluator";
            readonly type: "address";
        }, {
            readonly name: "description";
            readonly type: "string";
        }, {
            readonly name: "budget";
            readonly type: "uint256";
        }, {
            readonly name: "expiredAt";
            readonly type: "uint256";
        }, {
            readonly name: "status";
            readonly type: "uint8";
        }, {
            readonly name: "hook";
            readonly type: "address";
        }];
    }];
}, {
    readonly type: "function";
    readonly name: "setBudget";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "submit";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "deliverable";
        readonly type: "bytes32";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "complete";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "reason";
        readonly type: "bytes32";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "reject";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "reason";
        readonly type: "bytes32";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "claimRefund";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "setProvider";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "provider";
        readonly type: "address";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "fund";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "jobId";
        readonly type: "uint256";
    }, {
        readonly name: "expectedBudget";
        readonly type: "uint256";
    }, {
        readonly name: "optParams";
        readonly type: "bytes";
    }];
    readonly outputs: readonly [];
}];
