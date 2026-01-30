import { describe, it, expect } from 'vitest'
import { handleMetricsCommand } from '@/lib/slack/commands/metrics'
import { handleReportCommand } from '@/lib/slack/commands/report'
import { handleStatusCommand } from '@/lib/slack/commands/status'
import { SlackSlashCommand } from '@/lib/slack/verify'

// テスト用のペイロード生成
function createPayload(command: string, text: string = ''): SlackSlashCommand {
  return {
    token: 'test-token',
    team_id: 'T12345678',
    team_domain: 'test-workspace',
    channel_id: 'C12345678',
    channel_name: 'general',
    user_id: 'U12345678',
    user_name: 'testuser',
    command,
    text,
    response_url: 'https://hooks.slack.com/commands/xxx',
    trigger_id: '12345.12345',
    api_app_id: 'A12345678',
  }
}

describe('Slack Commands', () => {
  describe('handleMetricsCommand', () => {
    it('should return summary when no metric specified', async () => {
      const payload = createPayload('/metrics', '')
      const result = await handleMetricsCommand(payload)

      expect(result.text).toContain('メトリクスサマリー')
      expect(result.blocks).toBeDefined()
      expect(result.blocks!.length).toBeGreaterThan(0)
    })

    it('should return help when help requested', async () => {
      const payload = createPayload('/metrics', 'help')
      const result = await handleMetricsCommand(payload)

      expect(result.text).toContain('ヘルプ')
      expect(result.blocks).toBeDefined()
    })

    it('should return sessions detail', async () => {
      const payload = createPayload('/metrics', 'sessions')
      const result = await handleMetricsCommand(payload)

      expect(result.text).toContain('セッション')
      expect(result.blocks).toBeDefined()
    })

    it('should return webvitals data', async () => {
      const payload = createPayload('/metrics', 'webvitals')
      const result = await handleMetricsCommand(payload)

      expect(result.text).toContain('Core Web Vitals')
      expect(result.blocks).toBeDefined()
    })

    it('should handle unknown metric', async () => {
      const payload = createPayload('/metrics', 'unknown_metric')
      const result = await handleMetricsCommand(payload)

      expect(result.text).toContain('不明なメトリクス')
    })
  })

  describe('handleReportCommand', () => {
    it('should return help when help requested', async () => {
      const payload = createPayload('/report', 'help')
      const result = await handleReportCommand(payload)

      expect(result.text).toContain('ヘルプ')
      expect(result.blocks).toBeDefined()
    })

    it('should return generating message for daily report', async () => {
      const payload = createPayload('/report', 'daily')
      const result = await handleReportCommand(payload)

      expect(result.text).toContain('日次')
      expect(result.text).toContain('生成中')
    })

    it('should return generating message for weekly report', async () => {
      const payload = createPayload('/report', 'weekly')
      const result = await handleReportCommand(payload)

      expect(result.text).toContain('週次')
      expect(result.text).toContain('生成中')
    })
  })

  describe('handleStatusCommand', () => {
    it('should return system status', async () => {
      const payload = createPayload('/status', '')
      const result = await handleStatusCommand(payload)

      expect(result.text).toContain('システム状態')
      expect(result.blocks).toBeDefined()
      expect(result.response_type).toBe('ephemeral')
    })

    it('should include anomaly information', async () => {
      const payload = createPayload('/status', '')
      const result = await handleStatusCommand(payload)

      // blocksにステータス情報が含まれているか確認
      const blocksStr = JSON.stringify(result.blocks)
      expect(blocksStr).toContain('ステータス')
    })
  })
})
