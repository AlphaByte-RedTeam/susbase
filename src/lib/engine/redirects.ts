export async function getRedirectChain(startUrl: string): Promise<string[]> {
  const chain: string[] = [startUrl]
  let currentUrl = startUrl
  let count = 0
  const maxRedirects = 5

  while (count < maxRedirects) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 3000) // 3s timeout per hop

      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'SusBase-Bot/1.0',
        },
      })
      clearTimeout(id)

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (location) {
          try {
            // Handle relative or absolute URLs
            const nextUrl = new URL(location, currentUrl).toString()
            
            // Prevent infinite loops if redirecting to itself or already in chain
            if (chain.includes(nextUrl)) break
            
            chain.push(nextUrl)
            currentUrl = nextUrl
            count++
          } catch (urlError) {
            break // Invalid URL in location header
          }
        } else {
          break
        }
      } else {
        break
      }
    } catch (e) {
      // Network error, timeout, or blocked - stop following
      break
    }
  }
  return chain
}
