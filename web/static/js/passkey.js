/**
 * WebAuthn/Passkey Client Library for Star Wars RPG Character Manager
 * Handles passkey registration and authentication on the client side
 */

class PasskeyManager {
    constructor() {
        this.isSupported = this.checkWebAuthnSupport();
        this.baseUrl = '/api/auth/passkey';
    }

    /**
     * Check if WebAuthn is supported in this browser
     */
    checkWebAuthnSupport() {
        return !!(window.PublicKeyCredential && 
                 navigator.credentials && 
                 navigator.credentials.create && 
                 navigator.credentials.get);
    }

    /**
     * Convert base64url string to ArrayBuffer
     */
    base64urlToBuffer(base64url) {
        // Add padding if needed
        const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
        
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Convert ArrayBuffer to base64url string
     */
    bufferToBase64url(buffer) {
        const bytes = new Uint8Array(buffer);
        let binaryString = '';
        for (let i = 0; i < bytes.length; i++) {
            binaryString += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binaryString);
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    /**
     * Process WebAuthn credential creation options
     */
    processCreationOptions(options) {
        // Convert challenge to ArrayBuffer
        options.challenge = this.base64urlToBuffer(options.challenge);
        
        // Convert user ID to ArrayBuffer
        options.user.id = this.base64urlToBuffer(options.user.id);
        
        // Convert credential IDs in excludeCredentials
        if (options.excludeCredentials) {
            options.excludeCredentials.forEach(cred => {
                cred.id = this.base64urlToBuffer(cred.id);
            });
        }
        
        return options;
    }

    /**
     * Process WebAuthn credential request options
     */
    processRequestOptions(options) {
        // Convert challenge to ArrayBuffer
        options.challenge = this.base64urlToBuffer(options.challenge);
        
        // Convert credential IDs in allowCredentials
        if (options.allowCredentials) {
            options.allowCredentials.forEach(cred => {
                cred.id = this.base64urlToBuffer(cred.id);
            });
        }
        
        return options;
    }

    /**
     * Process credential response for transmission
     */
    processCredentialResponse(credential) {
        try {
            // Handle cross-compartment wrapper issues in Firefox
            const response = {
                id: credential.id,
                rawId: this.bufferToBase64url(credential.rawId),
                type: credential.type,
                response: {}
            };

            // Safely access credential.response properties
            const credResponse = credential.response;
            
            if (credResponse.attestationObject) {
                // Registration response
                response.response = {
                    attestationObject: this.bufferToBase64url(credResponse.attestationObject),
                    clientDataJSON: this.bufferToBase64url(credResponse.clientDataJSON)
                };
            } else {
                // Authentication response
                response.response = {
                    authenticatorData: this.bufferToBase64url(credResponse.authenticatorData),
                    clientDataJSON: this.bufferToBase64url(credResponse.clientDataJSON),
                    signature: this.bufferToBase64url(credResponse.signature)
                };
                
                if (credResponse.userHandle) {
                    response.response.userHandle = this.bufferToBase64url(credResponse.userHandle);
                }
            }

            return response;
        } catch (error) {
            console.error('Error processing credential response:', error);
            throw new Error('Failed to process WebAuthn credential: ' + error.message);
        }
    }

    /**
     * Safe credential processing for Firefox cross-compartment issues
     */
    async processCredentialResponseSafe(credential) {
        try {
            // Use JSON serialization to avoid cross-compartment wrapper issues
            const credentialCopy = JSON.parse(JSON.stringify({
                id: credential.id,
                type: credential.type
            }));
            
            // Manually extract ArrayBuffer data
            const response = {
                id: credentialCopy.id,
                rawId: this.bufferToBase64url(credential.rawId),
                type: credentialCopy.type,
                response: {}
            };

            // Use ArrayBuffer.slice to avoid wrapper issues
            if (credential.response.attestationObject) {
                // Registration response
                const attestationObject = new Uint8Array(credential.response.attestationObject.slice());
                const clientDataJSON = new Uint8Array(credential.response.clientDataJSON.slice());
                
                response.response = {
                    attestationObject: this.bufferToBase64url(attestationObject),
                    clientDataJSON: this.bufferToBase64url(clientDataJSON)
                };
            } else {
                // Authentication response
                const authenticatorData = new Uint8Array(credential.response.authenticatorData.slice());
                const clientDataJSON = new Uint8Array(credential.response.clientDataJSON.slice());
                const signature = new Uint8Array(credential.response.signature.slice());
                
                response.response = {
                    authenticatorData: this.bufferToBase64url(authenticatorData),
                    clientDataJSON: this.bufferToBase64url(clientDataJSON),
                    signature: this.bufferToBase64url(signature)
                };
                
                if (credential.response.userHandle) {
                    const userHandle = new Uint8Array(credential.response.userHandle.slice());
                    response.response.userHandle = this.bufferToBase64url(userHandle);
                }
            }

            return response;
        } catch (error) {
            console.error('Safe credential processing also failed:', error);
            throw new Error('Unable to process WebAuthn credential in this browser');
        }
    }

    /**
     * Make authenticated API request
     */
    async makeAuthenticatedRequest(url, options = {}) {
        const token = localStorage.getItem('access_token');
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Register a new passkey
     */
    async registerPasskey(name = '') {
        if (!this.isSupported) {
            throw new Error('WebAuthn is not supported in this browser');
        }

        try {
            // Step 1: Get registration options from server
            const beginResponse = await this.makeAuthenticatedRequest(`${this.baseUrl}/register/begin`, {
                method: 'POST',
                body: JSON.stringify({})
            });

            if (!beginResponse.ok) {
                const error = await beginResponse.json();
                throw new Error(error.error || 'Failed to begin passkey registration');
            }

            const { options } = await beginResponse.json();
            
            // Step 2: Process options and create credential
            const processedOptions = this.processCreationOptions(options);
            
            const credential = await navigator.credentials.create({
                publicKey: processedOptions
            });

            if (!credential) {
                throw new Error('Failed to create passkey');
            }

            // Step 3: Process credential response with Firefox workaround
            let credentialData;
            try {
                credentialData = this.processCredentialResponse(credential);
            } catch (error) {
                // Firefox cross-compartment wrapper workaround
                console.warn('Using Firefox WebAuthn workaround:', error.message);
                credentialData = await this.processCredentialResponseSafe(credential);
            }

            // Step 4: Complete registration on server
            const completeResponse = await this.makeAuthenticatedRequest(`${this.baseUrl}/register/complete`, {
                method: 'POST',
                body: JSON.stringify({
                    credential: credentialData,
                    name: name
                })
            });

            if (!completeResponse.ok) {
                const error = await completeResponse.json();
                throw new Error(error.error || 'Failed to complete passkey registration');
            }

            const result = await completeResponse.json();
            return { success: true, message: result.message };

        } catch (error) {
            console.error('Passkey registration error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Authenticate with passkey
     */
    async authenticateWithPasskey(username = '') {
        if (!this.isSupported) {
            throw new Error('WebAuthn is not supported in this browser');
        }

        try {
            // Step 1: Get authentication options from server
            const beginResponse = await fetch(`${this.baseUrl}/login/begin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            if (!beginResponse.ok) {
                const error = await beginResponse.json();
                throw new Error(error.error || 'Failed to begin passkey authentication');
            }

            const { options } = await beginResponse.json();
            
            // Step 2: Process options and get credential
            const processedOptions = this.processRequestOptions(options);
            
            const credential = await navigator.credentials.get({
                publicKey: processedOptions
            });

            if (!credential) {
                throw new Error('Failed to authenticate with passkey');
            }

            // Step 3: Process credential response
            const credentialData = this.processCredentialResponse(credential);

            // Step 4: Complete authentication on server
            const completeResponse = await fetch(`${this.baseUrl}/login/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    credential: credentialData
                })
            });

            if (!completeResponse.ok) {
                const error = await completeResponse.json();
                throw new Error(error.error || 'Failed to complete passkey authentication');
            }

            const result = await completeResponse.json();
            
            // Store access token
            if (result.access_token) {
                localStorage.setItem('access_token', result.access_token);
            }

            return { 
                success: true, 
                user: result.user, 
                access_token: result.access_token,
                message: result.message 
            };

        } catch (error) {
            console.error('Passkey authentication error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get list of user's passkeys
     */
    async getPasskeys() {
        try {
            const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/list`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get passkeys');
            }

            return await response.json();
        } catch (error) {
            console.error('Get passkeys error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Rename a passkey
     */
    async renamePasskey(passkeyId, newName) {
        try {
            const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/rename`, {
                method: 'POST',
                body: JSON.stringify({
                    passkey_id: passkeyId,
                    new_name: newName
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to rename passkey');
            }

            const result = await response.json();
            return { success: true, message: result.message };
        } catch (error) {
            console.error('Rename passkey error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete a passkey
     */
    async deletePasskey(passkeyId) {
        try {
            const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/delete`, {
                method: 'POST',
                body: JSON.stringify({
                    passkey_id: passkeyId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete passkey');
            }

            const result = await response.json();
            return { success: true, message: result.message };
        } catch (error) {
            console.error('Delete passkey error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if the current browser/device supports platform authenticators (built-in)
     */
    async checkPlatformAuthenticatorSupport() {
        if (!this.isSupported) {
            return false;
        }

        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return available;
        } catch (error) {
            console.warn('Could not check platform authenticator availability:', error);
            return false;
        }
    }

    /**
     * Show user-friendly error messages
     */
    getErrorMessage(error) {
        const errorMessages = {
            'NotSupportedError': 'Passkeys are not supported in this browser. Please use a modern browser.',
            'SecurityError': 'Security error occurred. Please make sure you are on a secure connection (HTTPS).',
            'NotAllowedError': 'Passkey operation was cancelled or not allowed.',
            'InvalidStateError': 'A passkey already exists for this account.',
            'ConstraintError': 'The passkey could not be created due to security constraints.',
            'UnknownError': 'An unknown error occurred. Please try again.',
            'NetworkError': 'Network error occurred. Please check your connection and try again.'
        };

        return errorMessages[error.name] || error.message || 'An unexpected error occurred.';
    }
}

// Global instance
window.passkeyManager = new PasskeyManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasskeyManager;
}