import { test, expect } from '@playwright/test'

test.describe('Scroll Reset', () => {
  test('should reset scroll position when switching sessions', async ({ page }) => {
    await page.goto('/')
    
    // Wait for sidebar to load
    await page.waitForSelector('.space-y-0\\.5')
    
    // Expand first folder
    const firstFolder = page.locator('button').filter({ has: page.locator('.w-3\\.5.h-3\\.5') }).first()
    await firstFolder.click()
    
    // Wait for sessions to be visible
    await page.waitForSelector('[data-session-id]', { timeout: 5000 })
    
    // Click on the second session (likely to have more content)
    const sessions = page.locator('[data-session-id]')
    await sessions.nth(1).click()
    
    // Wait for content to load
    await page.waitForTimeout(1500)
    
    // Find the chat container specifically (not the sidebar)
    const chatContainer = page.locator('.flex-1.overflow-y-auto').filter({ 
      hasNot: page.locator('.space-y-0\\.5') 
    }).first()
    
    // Check if content is scrollable
    const isScrollable = await chatContainer.evaluate((el) => {
      return el.scrollHeight > el.clientHeight
    })
    
    if (!isScrollable) {
      // Try another session
      await sessions.nth(2).click()
      await page.waitForTimeout(1500)
      
      const isNowScrollable = await chatContainer.evaluate((el) => {
        return el.scrollHeight > el.clientHeight
      })
      
      if (!isNowScrollable) {
        test.skip()
        return
      }
    }
    
    // Scroll down
    await chatContainer.evaluate((el) => {
      el.scrollTop = 500
    })
    
    // Verify we scrolled
    const scrolledPosition = await chatContainer.evaluate((el) => el.scrollTop)
    expect(scrolledPosition).toBeGreaterThan(0)
    
    // Click a different session
    await sessions.first().click()
    
    // Wait for content to load and scroll reset to happen
    await page.waitForTimeout(1500)
    
    // Check that scroll was reset
    const newScrollPosition = await chatContainer.evaluate((el) => el.scrollTop)
    expect(newScrollPosition).toBe(0)
  })
})