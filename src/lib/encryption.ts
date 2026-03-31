/**
 * Chiffrement des documents sensibles
 * Agent 9 — Auth & Security (Chiffrement documents)
 * Algorithme: AES-256-GCM
 */
import crypto from "crypto";

// Clé de chiffrement depuis les variables d'environnement
const ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY || 
  (console.warn("[Encryption] DOCUMENT_ENCRYPTION_KEY non configuré — utilisation clé de développement"), 
   "orion-dev-key-32-chars-for-development!");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Génère une clé de chiffrement sécurisée (à utiliser une fois pour créer DOCUMENT_ENCRYPTION_KEY)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Chiffre une chaîne de caractères
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY.slice(0, 32)), 
      iv
    );
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("[Encryption] Erreur chiffrement:", error);
    throw new Error("Échec du chiffrement du document");
  }
}

/**
 * Déchiffre une chaîne chiffrée
 */
export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Format de données chiffrées invalide");
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
      iv
    );
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[Encryption] Erreur déchiffrement:", error);
    throw new Error("Échec du déchiffrement — clé invalide ou données corrompues");
  }
}

/**
 * Chiffre un objet JSON
 */
export function encryptObject<T extends Record<string, unknown>>(obj: T): string {
  return encrypt(JSON.stringify(obj));
}

/**
 * Déchiffre et parse un objet JSON
 */
export function decryptObject<T extends Record<string, unknown>>(encryptedData: string): T {
  const decrypted = decrypt(encryptedData);
  return JSON.parse(decrypted) as T;
}

/**
 * Hache un identifiant sensible (pour recherche sans exposer la valeur)
 * Utilise SHA-256 avec salt unique pour éviter les rainbow tables
 */
export function hashIdentifier(identifier: string, salt?: string): string {
  const uniqueSalt = salt || process.env.HASH_SALT || "orion-default-salt";
  return crypto
    .createHmac("sha256", uniqueSalt)
    .update(identifier)
    .digest("hex");
}

/**
 * Vérifie si le chiffrement est correctement configuré
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.DOCUMENT_ENCRYPTION_KEY && 
         process.env.DOCUMENT_ENCRYPTION_KEY.length >= 32;
}

/**
 * Chiffre les données sensibles d'un document pour stockage
 * Types de documents concernés: BL, CMR, AWB (données commerciales)
 */
export function encryptDocumentMetadata(
  metadata: Record<string, unknown>,
  sensitiveFields: string[] = ["consignee", "shipper", "cargo_value", "bl_number"]
): Record<string, unknown> {
  const encrypted = { ...metadata };
  
  for (const field of sensitiveFields) {
    if (metadata[field] && typeof metadata[field] === "string") {
      encrypted[field] = `ENC:${encrypt(metadata[field] as string)}`;
    }
  }
  
  return encrypted;
}

/**
 * Déchiffre les métadonnées d'un document
 */
export function decryptDocumentMetadata(
  encryptedMetadata: Record<string, unknown>
): Record<string, unknown> {
  const decrypted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(encryptedMetadata)) {
    if (typeof value === "string" && value.startsWith("ENC:")) {
      try {
        decrypted[key] = decrypt(value.slice(4));
      } catch {
        decrypted[key] = value; // Garde la valeur originale si échec
      }
    } else {
      decrypted[key] = value;
    }
  }
  
  return decrypted;
}
