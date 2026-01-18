/**
 * Google API 認証ユーティリティ
 * サービスアカウントの認証情報を管理
 */

export function getGoogleCredentials() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  if (!credentialsJson) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set'
    )
  }

  try {
    return JSON.parse(credentialsJson)
  } catch {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format')
  }
}

export function isGoogleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
    process.env.GA4_PROPERTY_ID
  )
}

export function isGSCConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
    process.env.GSC_SITE_URL
  )
}







