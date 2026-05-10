export interface Document {
  id: string
  fileName: string
  contentType: string
  size: number
  version: string
  createdAt: string
  updatedAt: string
}

export interface WopiTokenInfo {
  access_token: string
  access_token_ttl: number
  wopi_src: string
  wopi_src_encoded: string
  file_name: string
  file_id: string
}

export interface AuthUser {
  id: string
  username: string
  email: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

