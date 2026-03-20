import { rareIntegration } from '../protocols/rare';
import { pinataClient } from '../protocols/pinata';
import { logger } from '../utils/logger';
import * as path from 'path';

/**
 * Example: Minting an NFT and pushing its assets to IPFS via Pinata
 * 
 * This example demonstrates:
 * 1. Uploading an image to IPFS via Pinata
 * 2. Creating and uploading metadata JSON to IPFS via Pinata
 * 3. Minting the NFT using the Rare Protocol (with the IPFS data)
 */
async function runExample() {
    try {
        const assetPath = path.join(__dirname, '../../assets/nft_image.png');
        const collectionAddress = '0x123...'; // Replace with actual collection address

        console.log('🚀 Starting NFT Minting & IPFS Push via Pinata...');

        // 1. Upload the image to IPFS via Pinata
        console.log('📤 Uploading image to Pinata...');
        const imageResult = await pinataClient.uploadFile(assetPath);
        console.log(`✅ Image uploaded! CID: ${imageResult.cid}`);
        console.log(`🔗 Image URI: ${imageResult.uri}`);

        // 2. Prepare and upload metadata JSON to IPFS via Pinata
        console.log('📤 Uploading metadata to Pinata...');
        const metadata = {
            name: 'SignalMint NFT #1',
            description: 'An autonomous NFT minted using Rare Protocol and Pinata',
            image: imageResult.uri,
            attributes: [
                { trait_type: 'Protocol', value: 'Rare' },
                { trait_type: 'Storage', value: 'Pinata/IPFS' },
                { trait_type: 'Agent', value: 'Autonomous' }
            ]
        };

        const metadataResult = await pinataClient.uploadJson(metadata, 'nft_metadata.json');
        console.log(`✅ Metadata uploaded! CID: ${metadataResult.cid}`);
        console.log(`🔗 Metadata URI: ${metadataResult.uri}`);

        // 3. Mint the NFT with the Rare Protocol
        // Note: Rare protocol's 'mint' might manage its own IPFS internally, 
        // but here we show how to use Pinata for your own assets first.
        console.log('🏗️ Minting NFT via Rare Protocol...');
        const mintResult = await rareIntegration.mintNFT(
            collectionAddress,
            metadata.name,
            metadata.description,
            assetPath, // Rare CLI still needs the local path for its internal flow
            {
                ipfs_cid: metadataResult.cid, // Passing custom data if needed
                storage: 'Pinata'
            }
        );

        console.log('🎉 NFT Minted Successfully!');
        console.log(`📦 Token ID: ${mintResult.tokenId}`);
        console.log(`📜 TX Hash: ${mintResult.txHash}`);
        console.log(`🌐 Rare IPFS URI: ${mintResult.ipfsUri}`);

    } catch (error) {
        console.error('❌ Example failed:', error);
        process.exit(1);
    }
}

// Execution
if (require.main === module) {
    runExample();
}
