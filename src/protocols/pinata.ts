import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../shared/config';
import { logger } from '../utils/logger';

/**
 * Pinata Client for IPFS uploads
 * This client uses Pinata's API to upload metadata and assets to IPFS.
 */
export class PinataClient {
    private apiKey: string | undefined;
    private secretKey: string | undefined;
    private jwt: string | undefined;
    private baseUrl = 'https://api.pinata.cloud';

    constructor() {
        this.apiKey = config.pinata.apiKey;
        this.secretKey = config.pinata.secretKey;
        this.jwt = config.pinata.jwt;
    }

    /**
     * Upload a JSON object to IPFS via Pinata
     * @param data The JSON object to upload
     * @param name Optional name for the file in Pinata
     * @returns The IPFS CID and URI
     */
    async uploadJson(data: any, name: string = 'metadata.json'): Promise<{ cid: string; uri: string }> {
        try {
            const payload = {
                pinataOptions: {
                    cidVersion: 1
                },
                pinataMetadata: {
                    name: name
                },
                pinataContent: data
            };

            const headers = this.getHeaders();
            const response = await axios.post(`${this.baseUrl}/pinning/pinJSONToIPFS`, payload, { headers });

            const cid = response.data.IpfsHash;
            const uri = `ipfs://${cid}`;

            logger.log('PinataClient', 'uploadJson', { name, cid }, 'success');
            return { cid, uri };
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message;
            logger.log('PinataClient', 'uploadJson', { name }, 'failed', errorMsg);
            throw new Error(`Pinata JSON upload failed: ${errorMsg}`);
        }
    }

    /**
     * Upload a file to IPFS via Pinata
     * @param filePath Path to the file to upload
     * @returns The IPFS CID and URI
     */
    async uploadFile(filePath: string): Promise<{ cid: string; uri: string }> {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found at path: ${filePath}`);
            }

            const fileName = path.basename(filePath);
            const data = new FormData();

            // Node.js 22+ supports native FormData and File
            const fileBuffer = fs.readFileSync(filePath);
            const blob = new Blob([fileBuffer]);
            data.append('file', blob, fileName);

            const pinataOptions = JSON.stringify({
                cidVersion: 1,
            });
            data.append('pinataOptions', pinataOptions);

            const pinataMetadata = JSON.stringify({
                name: fileName,
            });
            data.append('pinataMetadata', pinataMetadata);

            const headers = this.getHeaders(true);

            const response = await axios.post(`${this.baseUrl}/pinning/pinFileToIPFS`, data, {
                headers
            });

            const cid = response.data.IpfsHash;
            const uri = `ipfs://${cid}`;

            logger.log('PinataClient', 'uploadFile', { fileName, cid }, 'success');
            return { cid, uri };
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message;
            logger.log('PinataClient', 'uploadFile', { filePath }, 'failed', errorMsg);
            throw new Error(`Pinata file upload failed: ${errorMsg}`);
        }
    }

    private getHeaders(isFormData: boolean = false) {
        const headers: any = {};

        if (this.jwt) {
            headers['Authorization'] = `Bearer ${this.jwt}`;
        } else if (this.apiKey && this.secretKey) {
            headers['pinata_api_key'] = this.apiKey;
            headers['pinata_secret_api_key'] = this.secretKey;
        } else {
            throw new Error('Pinata credentials missing. Provide either JWT or API Key + Secret Key.');
        }

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }
}

export const pinataClient = new PinataClient();
