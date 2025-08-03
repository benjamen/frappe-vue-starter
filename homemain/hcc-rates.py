import asyncio
import requests
from playwright.async_api import async_playwright

async def download_rates_pdf(property_id, save_path):
    url = f"https://maps.huttcity.govt.nz/Ratesreport/load.html?address={property_id}"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        await page.goto(url)
        # Wait for the results div with the link
        await page.wait_for_selector("#Results a", timeout=60000)
        pdf_url = await page.locator("#Results a").get_attribute("href")
        print(f"Found PDF link: {pdf_url}")
        await browser.close()

    # If the pdf_url is relative, make it absolute
    if pdf_url.startswith('/'):
        pdf_url = 'https://maps.huttcity.govt.nz' + pdf_url

    # Download the PDF using requests
    response = requests.get(pdf_url)
    with open(save_path, "wb") as f:
        f.write(response.content)
    print(f"Downloaded PDF to {save_path}")

if __name__ == "__main__":
    property_id = "1998600"  # Example scraped ID
    save_path = f"rates_{property_id}.pdf"
    asyncio.run(download_rates_pdf(property_id, save_path))
