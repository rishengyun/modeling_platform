/**
 * AES-256-CBC 对称加解密工具
 *
 * 用于嵌入登录场景：父系统用 CryptoJS.AES.encrypt() 加密 "username:password"，
 * 通过 URL token 参数传递。前端用 Web Crypto API 解密后调现有后端登录接口。
 * 后端无需改动。
 *
 * 算法细节（与 CryptoJS 对齐）：
 *   - 密钥派生：SHA-256(共享密钥) → 32 字节 AES-256 key
 *   - 加密模式：AES-CBC，IV 16 字节，PKCS7 填充
 *   - 编码格式：Base64URL( IV + Ciphertext )
 *
 * 父系统 CryptoJS 加密参考：
 *   const key = CryptoJS.SHA256(secret);
 *   const iv = CryptoJS.lib.WordArray.random(16);
 *   const encrypted = CryptoJS.AES.encrypt("username:password", key, { iv });
 *   const token = CryptoJS.enc.Base64url.stringify(iv.clone().concat(encrypted.ciphertext));
 */

const IV_LENGTH = 16 // AES-CBC IV 固定 16 字节

/**
 * 将 ArrayBuffer 转为 Base64URL 字符串
 */
function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * 将 Base64URL 字符串转为 Uint8Array
 */
function base64URLToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * 从共享密钥字符串派生 AES-256-CBC 密钥（SHA-256 哈希 → 32 字节）
 */
async function deriveKey(rawSecret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(rawSecret))
  return crypto.subtle.importKey('raw', hash, { name: 'AES-CBC' }, false, [
    'encrypt',
    'decrypt',
  ])
}

export interface DecryptResult {
  username: string
  password: string
}

/**
 * 解密 token，返回 { username, password }
 *
 * @param token  - Base64URL 编码的密文（前 16 字节为 IV，余下为 AES-CBC 密文）
 * @param secret - 预共享密钥字符串
 * @returns 解密后的用户名和密码
 * @throws  解密失败时抛出 Error
 */
export async function decryptEmbedToken(
  token: string,
  secret: string,
): Promise<DecryptResult> {
  if (!token || !secret) {
    throw new Error('token 或 secret 为空')
  }

  const key = await deriveKey(secret)
  const encrypted = base64URLToBuffer(token)

  if (encrypted.length < IV_LENGTH + 1) {
    throw new Error('密文长度不足')
  }

  const iv = encrypted.slice(0, IV_LENGTH)
  const ciphertext = encrypted.slice(IV_LENGTH)

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      ciphertext,
    )
    const plaintext = new TextDecoder().decode(decrypted)
    const colonIndex = plaintext.indexOf(':')

    if (colonIndex === -1) {
      throw new Error('解密后格式不正确，期望 username:password')
    }

    return {
      username: plaintext.substring(0, colonIndex),
      password: plaintext.substring(colonIndex + 1),
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('格式不正确')) {
      throw err
    }
    throw new Error('解密失败，密钥不匹配或数据已损坏')
  }
}

/**
 * 加密 username:password，返回 Base64URL token
 *
 * 本函数仅供本地测试。父系统侧应使用 CryptoJS：
 *   const key = CryptoJS.SHA256(secret);
 *   const iv = CryptoJS.lib.WordArray.random(16);
 *   const encrypted = CryptoJS.AES.encrypt("username:password", key, { iv });
 *   const token = CryptoJS.enc.Base64url.stringify(iv.clone().concat(encrypted.ciphertext));
 */
export async function encryptEmbedCredentials(
  username: string,
  password: string,
  secret: string,
): Promise<string> {
  if (!username || !password || !secret) {
    throw new Error('参数不能为空')
  }

  const key = await deriveKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()
  const plaintext = encoder.encode(`${username}:${password}`)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    plaintext,
  )

  const combined = new Uint8Array(IV_LENGTH + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), IV_LENGTH)

  return bufferToBase64URL(combined.buffer)
}
