
export interface CreateVaultRequest {
  name: string;
  type: 'PERSONAL' | 'GROUP' | 'STEALTH';
  encryptedVaultKey: string;
}

export interface CreateItemRequest {
  vaultId: string;
  type: 'LOGIN' | 'CARD' | 'NOTE' | 'IDENTITY';
  encryptedBlob: string;
  metadata?: {
    name?: string;
    url?: string;
    favicon?: string;
    category?: string;
  };
}

export interface UpdateItemRequest {
  encryptedBlob?: string;
  metadata?: any;
}

export interface ShareVaultRequest {
  email: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
}


export interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

export interface VaultResponse {
  id: string;
  name: string;
  type: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemResponse {
  id: string;
  vaultId: string;
  type: string;
  encryptedBlob: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
}
