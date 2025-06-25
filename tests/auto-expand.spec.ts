import { test, expect } from '@playwright/test'

test('should auto-expand to a session when navigating via URL', async ({ page }) => {
  // Enable console logging to debug
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('Browser console:', msg.text())
    }
  })
  
  // First, navigate to the home page to get a real session ID
  await page.goto('/')
  
  // Wait for sidebar to load
  await page.waitForSelector('.space-y-0\\.5')
  
  // Expand first folder
  const firstFolder = page.locator('button').filter({ has: page.locator('.w-3\\.5.h-3\\.5') }).first()
  await firstFolder.click()
  
  // Wait for sessions and get the first one
  await page.waitForSelector('[data-session-id]')
  const firstSessionId = await page.locator('[data-session-id]').first().getAttribute('data-session-id')
  
  if (!firstSessionId) {
    test.skip()
    return
  }
  
  // Now navigate to that session via URL
  await page.goto(`/?session=${firstSessionId}`)
  
  // Wait a bit longer for auto-expand logic
  await page.waitForTimeout(1000)
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/auto-expand-test.png', fullPage: true })
  
  // Check if the specific session is visible
  const sessionButton = page.locator(`[data-session-id="${firstSessionId}"]`)
  
  // Wait for it to be visible with a longer timeout
  await expect(sessionButton).toBeVisible({ timeout: 5000 })
  
  // Check if it's selected
  await expect(sessionButton).toHaveClass(/bg-blue-100/)
  
  // Check if it's in the viewport
  const boundingBox = await sessionButton.boundingBox()
  if (boundingBox) {
    const viewport = page.viewportSize()
    if (viewport) {
      const isInView = boundingBox.y >= 0 && boundingBox.y <= viewport.height
      expect(isInView).toBe(true)
    }
  }
})