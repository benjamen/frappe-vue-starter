# homemain/property_council_scraper.py

import asyncio
from urllib.parse import quote_plus
from playwright.async_api import async_playwright, TimeoutError
import frappe

def clean_address(addr):
    """Lowercase, strip, remove commas, collapse whitespace."""
    return ' '.join(addr.replace(",", " ").strip().lower().split())

async def scrape_hcc_property(address_query):
    print(f"[INFO] [Council Scraper] Launching browser for: {address_query}")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, slow_mo=80)
        try:
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            query_url = "https://www.huttcity.govt.nz/property-and-building/search-property-and-building?query=" + quote_plus(address_query)
            print(f"[INFO] Navigating to: {query_url}")
            await page.goto(query_url, wait_until="domcontentloaded", timeout=70000)
            await asyncio.sleep(2)

            table_selector = ".smp-search-table-results__wrapper"
            try:
                await page.wait_for_selector(table_selector, timeout=15000)
                print("[INFO] Results table found.")
            except TimeoutError:
                print("[ERROR] No results table.")
                return None, None

            rows = await page.locator(f"{table_selector} tr").all()
            print(f"[INFO] Found {len(rows)} search result rows.")

            target_address = clean_address(address_query)
            target_link = None
            property_id = None
            for row in rows:
                cells = await row.locator("td").all()
                if len(cells) >= 3:
                    cell_text = clean_address(await cells[2].text_content() or '')
                    print(f"[DEBUG] Checking: {cell_text}")
                    if cell_text == target_address:
                        print(f"[SUCCESS] Matched: {cell_text}")
                        link = await cells[0].locator("a").element_handle()
                        property_id = (await cells[1].text_content()).strip()
                        if link:
                            target_link = link
                            break

            if not target_link:
                print("[ERROR] No property result found for", address_query)
                return None, None

            print("[INFO] Clicking property link…")
            await target_link.click()
            print("[INFO] Waiting for property details table…")
            try:
                await page.wait_for_selector(".table-responsive", timeout=12000)
                print("[INFO] Table loaded, scraping details.")
            except TimeoutError:
                print("[ERROR] Property details table did not load.")
                return {}, property_id

            details = {}
            rows = await page.locator(".table-responsive tr").all()
            for row in rows:
                try:
                    label = (await row.locator("th").text_content()).strip()
                    value = (await row.locator("td").text_content()).strip()
                    details[label] = value
                except Exception:
                    continue

            print(f"[INFO] Scraped property details: {details}")
            return details, property_id
        finally:
            await browser.close()
            print("[INFO] Closed browser.")

def get_property_info_sync(address_query):
    """
    Synchronous wrapper for async scrape_hcc_property.
    Always clean the address!
    """
    clean = clean_address(address_query)
    async def _main():
        details, property_id = await scrape_hcc_property(clean)
        all_data = {}
        if property_id:
            all_data = {
                "property_web_details": details,
                "property_id": property_id
            }
        return all_data
    return asyncio.run(_main())

def scrape_and_update_home(docname):
    home = frappe.get_doc("Home", docname)
    try:
        home.db_set("scraper_status", "In Progress")
        home.db_set("scraper_message", "Scraping in progress...")

        address = (home.address or "")
        print(f"[INFO] [Council Scraper] Scraping for cleaned address: '{address}'")

        scraped = get_property_info_sync(address)
        if not scraped or not scraped.get("property_web_details"):
            home.db_set("scraper_status", "Failed")
            home.db_set("scraper_message", "No results found or scrape failed.")
            return

        web = scraped.get("property_web_details")
        home.db_set("council_property_id", web.get("Property ID"))
        home.db_set("council_address", web.get("Address"))
        home.db_set("council_legal_description", web.get("Legal Description"))
        # Add more mappings as you wish!

        home.db_set("scraper_status", "Success")
        home.db_set("scraper_message", "Scraped successfully!")
    except Exception as e:
        home.db_set("scraper_status", "Failed")
        home.db_set("scraper_message", f"Scraper failed: {e}")
        frappe.log_error(f"Home scraper error for {docname}: {e}", "homemain.property_council_scraper")
        print(f"[ERROR] Scraper failed for {docname}: {e}")
    finally:
        print(f"[INFO] Home {docname} updated with scraper status.")
        frappe.db.commit()
        print("[INFO] Scraping complete, changes committed to database.")
