/**
 * Application configuration
 */

// Network configuration
const NETWORK = {
    id: '0g',
    name: '0G Network',
    chainId: '0x40d9',  // 16601
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    rpcUrls: [
        'https://og-testnet-evm.itrocket.net',
        'https://evmrpc-testnet.0g.ai',
        'https://lightnode-json-rpc-0g.grandvalleys.com',
        'https://0g-json-rpc-public.originstake.com'
    ],
    blockExplorer: 'https://chainscan-galileo.0g.ai',
    contractAddress: '0x3ad6ca089c783c637b7049c82aaf317a055fd850',
    icon: 'https://chainscan-galileo.0g.ai/favicon.ico',
    nativeCurrency: {
        name: '0G',
        symbol: '0G',
        decimals: 18
    }
};

// API configuration for image generation
const API_CONFIG = {
    huggingface: {
        apiKey: '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',
        modelId: 'stabilityai/stable-diffusion-xl-base-1.0',
        endpoint: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0'
    },
    avalai: {
        apiKey: 'aa-jZRY4oEb6yZiOxgeLSnnOghsKPpz7EMRuv87Z4jjJwPiQxlm',
        baseUrl: 'https://api.avalai.ir/v1',
        model: 'dall-e-3'
    }
};

// IPFS configuration
const IPFS_CONFIG = {
    pinata: {
        apiKey: '341e9a96ef1294b0f188',
        secretKey: '3be8a56599974c876d3d3b718d5217ae9e6bc2ada877e8127e5491438d5744f5',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhNmRkMDM1MS00MjE4LTQxNjItOTNkMC1mYjQ3MzNjODg4ZmQiLCJlbWFpbCI6InNhZGVnaHNzNTBAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjM0MWU5YTk2ZWYxMjk0YjBmMTg4Iiwic2NvcGVkS2V5U2VjcmV0IjoiM2JlOGE1NjU5OTk3NGM4NzZkM2QzYjcxOGQ1MjE3YWU5ZTZiYzJhZGE4NzdlODEyN2U1NDkxNDM4ZDU3NDRmNSIsImV4cCI6MTc3MjkxNjgyOX0.fzaFQAMom-CLe7vl6qc6zDy63-L5mEE-B4ypDr8zAF4',
        gateway: 'https://gateway.pinata.cloud/ipfs/'
    }
};

// Prompt suggestions for AI image generation
const PROMPT_SUGGESTIONS = [
    "A cute cartoon alien with big eyes holding a flower in a colorful garden",
    "A friendly robot pet with glowing eyes in a futuristic city",
    "An adorable dragon baby hatching from an iridescent egg",
    "A fluffy cloud creature with rainbow wings flying over mountains",
    "A magical forest spirit made of glowing plants and flowers",
    "A tiny underwater mermaid cat playing with bubbles",
    "A crystalline ice fox with aurora borealis patterns",
    "A smiling moon character wearing a star crown",
    "A miniature galaxy contained within a friendly slime creature",
    "A plant-animal hybrid with leaves for ears and flower eyes"
];

// Animation settings
const ANIMATION_SETTINGS = {
    duration: 0.5,
    cardStagger: 0.1,
    particleCount: 50
};


// IMPORTANT: Remove NFT_ABI from here since it's in abi.js
