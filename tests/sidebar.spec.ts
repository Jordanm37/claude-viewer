import { test, expect } from '@playwright/test'

test.describe('Sidebar Navigation', () => {
  test('should auto-expand tree when navigating to session via URL', async ({ page }) => {
    // First get a real session ID from the page
    await page.goto('/')
    await page.waitForSelector('.space-y-0\\.5')
    
    // Expand first folder
    const firstFolder = page.locator('button').filter({ has: page.locator('.w-3\\.5.h-3\\.5') }).first()
    await firstFolder.click()
    
    // Get a session ID
    await page.waitForSelector('[data-session-id]')
    const sessionId = await page.locator('[data-session-id]').first().getAttribute('data-session-id')
    
    if (!sessionId) {
      test.skip()
      return
    }
    
    // Navigate to a specific session URL
    await page.goto(`/?session=${sessionId}`)
    
    // Wait for the sidebar to load
    await page.waitForSelector('[data-session-id]')
    
    // Check if the session is visible and selected
    const sessionButton = page.locator(`[data-session-id="${sessionId}"]`)
    await expect(sessionButton).toBeVisible()
    
    // Check if it has the selected state (blue background)
    await expect(sessionButton).toHaveClass(/bg-blue-100/)
    
    // Verify the session is scrolled into view
    const isInViewport = await sessionButton.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= window.innerHeight
    })
    expect(isInViewport).toBe(true)
  })

  test('should update active state when clicking different sessions', async ({ page }) => {
    await page.goto('/')
    
    // Wait for sidebar to load
    await page.waitForSelector('.space-y-0\\.5')
    
    // Click first folder to expand it
    const firstFolder = page.locator('button').filter({ has: page.locator('.w-3\\.5.h-3\\.5') }).first()
    await firstFolder.click()
    
    // Wait for sessions to be visible
    await page.waitForSelector('[data-session-id]', { timeout: 5000 })
    
    // Get first two sessions
    const sessions = page.locator('[data-session-id]')
    const firstSession = sessions.first()
    const secondSession = sessions.nth(1)
    
    // Click first session
    await firstSession.click()
    await expect(firstSession).toHaveClass(/bg-blue-100/)
    
    // Click second session
    await secondSession.click()
    
    // First should no longer be selected
    await expect(firstSession).not.toHaveClass(/bg-blue-100/)
    // Second should be selected
    await expect(secondSession).toHaveClass(/bg-blue-100/)
  })


  test('session titles should wrap to multiple lines', async ({ page }) => {
    await page.goto('/')
    
    // Wait for sidebar to load
    await page.waitForSelector('.space-y-0\\.5')
    
    // Click first folder to expand it
    const firstFolder = page.locator('button').filter({ has: page.locator('.w-3\\.5.h-3\\.5') }).first()
    await firstFolder.click()
    
    // Wait for sessions to be visible
    await page.waitForSelector('[data-session-id]', { timeout: 5000 })
    
    // Find a session title
    const sessionTitle = page.locator('[data-session-id] p').first()
    
    // Check that it has the proper classes for text wrapping
    await expect(sessionTitle).toHaveClass(/break-words/)
    await expect(sessionTitle).toHaveClass(/leading-relaxed/)
  })
})