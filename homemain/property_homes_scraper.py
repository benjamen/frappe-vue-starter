import asyncio
from playwright.async_api import async_playwright, TimeoutError
import frappe

async def scrape_homes_estimates(details_page):
    """Scrape the 'Property estimates' section (HomesEstimate) from details_page."""
    data = {}

    try:
        # Wait for the Property estimates section
        await details_page.wait_for_selector('#propertyEstimates', timeout=8000)
        estimate_section = details_page.locator('#propertyEstimates')

        # HomesEstimate date (e.g., "HomesEstimate: 7 Aug 2025")
        try:
            date_text = await estimate_section.locator('h3.date').text_content()
            if date_text and "HomesEstimate:" in date_text:
                data['homes_estimate_date'] = date_text.split("HomesEstimate:")[-1].strip()
            else:
                data['homes_estimate_date'] = date_text.strip() if date_text else "N/A"
        except Exception:
            data['homes_estimate_date'] = "N/A"

        # HomesEstimate value (main price, e.g., "$840K")
        try:
            value = await estimate_section.locator('.display_price.large').text_content()
            data['homes_estimate_value'] = value.strip() if value else "N/A"
        except Exception:
            data['homes_estimate_value'] = "N/A"

        # Estimate range (min/max, e.g., "$785K", "$895K")
        try:
            range_prices = await estimate_section.locator('.estimate_range_price .display_price').all()
            if len(range_prices) == 2:
                min_val = await range_prices[0].text_content()
                max_val = await range_prices[1].text_content()
                data['homes_estimate_range_min'] = min_val.strip() if min_val else "N/A"
                data['homes_estimate_range_max'] = max_val.strip() if max_val else "N/A"
            else:
                data['homes_estimate_range_min'] = data['homes_estimate_range_max'] = "N/A"
        except Exception:
            data['homes_estimate_range_min'] = data['homes_estimate_range_max'] = "N/A"

        # Suburb estimate value (e.g. "$835K" for Maungaraki)
        try:
            suburb_val = "N/A"
            suburb_name = "N/A"
            graph = estimate_section.locator("homes-hest-property-graph")
            info_blocks = await graph.locator('.info').all()
            for block in info_blocks:
                name = (await block.locator('.name').text_content() or "").strip()
                value = (await block.locator('.value').text_content() or "").strip()
                # Choose the suburb block (not "This home" or "Estimate range")
                if name and value and name.lower() not in ["this home", "estimate range (this home)", "range (this home)"]:
                    suburb_name = name
                    suburb_val = value
                    break
            data['homes_estimate_suburb'] = suburb_name
            data['homes_estimate_suburb_value'] = suburb_val
        except Exception:
            data['homes_estimate_suburb'] = data['homes_estimate_suburb_value'] = "N/A"

    except TimeoutError:
        print("[ERROR] Property estimates section not found!")
    return data

async def _async_scrape_homes(address):
    print(f"[INFO] [Homes.co.nz Scraper] Searching for address: {address}")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, slow_mo=60)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        await page.goto("https://homes.co.nz/", timeout=60000)
        await asyncio.sleep(2)

        # Search for the property
        await page.fill('input[placeholder^="Search"]', address)
        await asyncio.sleep(1)
        await page.keyboard.press("Enter")
        print("[INFO] Submitted search...waiting for map view page.")

        # Wait for map view redirect
        for _ in range(15):
            if "/map/" in page.url:
                print(f"[INFO] Arrived on map page: {page.url}")
                break
            await asyncio.sleep(1)
        else:
            print("[ERROR] Never arrived on map view page!")
            await browser.close()
            return None

        await asyncio.sleep(2)
        try:
            await page.wait_for_selector('a.heroImage', timeout=10000)
            cards = await page.locator('a.heroImage').all()
        except Exception as e:
            print("[ERROR] No property cards found:", e)
            await browser.close()
            return None

        # Find matching address card
        wanted = address.split(",")[0].strip().lower()
        match_card = None
        for card in cards:
            card_address = (await card.text_content() or "").strip().lower()
            if wanted in card_address:
                match_card = card
                print(f"[SUCCESS] Matched card for address: {card_address}")
                break
        if not match_card:
            print(f"[ERROR] No card matched {wanted}!")
            await browser.close()
            return None

        # Open property details in new page
        await match_card.click()
        details_page = page  # just keep using page
        await details_page.wait_for_load_state("domcontentloaded")
        await asyncio.sleep(2)

        # --- SCRAPE COUNCIL SECTION ---
        council_data = {}

        try:
            # Wait for the Council section to appear
            await details_page.wait_for_selector('homes-more-details-section#councilDataSection', timeout=15000)
            council_section = details_page.locator('homes-more-details-section#councilDataSection')
            # Find all council badges
            badges = await council_section.locator('homes-more-details-dialog-badge').all()
            print(f"[INFO] Found {len(badges)} council detail badges")
            for badge in badges:
                # Title: p.title, Value: p.content
                label = (await badge.locator("p.title").text_content() or "").strip()
                value = (await badge.locator("p.content").all_text_contents())
                value = " ".join(v.strip() for v in value if v.strip())
                if label:
                    key = (
                        label.lower()
                        .replace(" ", "_")
                        .replace(":", "")
                        .replace(".", "")
                        .replace("-", "_")
                    )
                    council_data[key] = value
                    print(f"[COUNCIL] {label} = {value}")
        except Exception as e:
            print("[ERROR] Failed to scrape council details:", e)

        # --- SCRAPE PROPERTY ESTIMATES SECTION ---
        estimate_data = await scrape_homes_estimates(details_page)
        if estimate_data:
            print("[INFO] Scraped property estimate section:")
            for k, v in estimate_data.items():
                print(f"  {k}: {v}")
            council_data.update(estimate_data)

        await browser.close()
        print("[INFO] Finished. All scraped data:")
        for k, v in council_data.items():
            print(f"  {k}: {v}")

        return council_data

def scrape_and_update_home_estimates(docname):
    home = frappe.get_doc("Home", docname)
    try:
        home.db_set("scraper_status", "HomesScraper In Progress")
        home.db_set("scraper_message", "Scraping homes.co.nz in progress...")
        address = home.address or ""
        print(f"[INFO] [HomesScraper] Scraping for address: '{address}'")
        scraped = asyncio.run(_async_scrape_homes(address))
        if not scraped:
            home.db_set("scraper_status", "Failed")
            home.db_set("scraper_message", "No results found or scrape failed.")
            return
        for k, v in scraped.items():
            # Only set fields that exist in DocType, and that you scraped
            if hasattr(home, k):
                home.db_set(k, v)
        home.db_set("scraper_status", "Success")
        home.db_set("scraper_message", "Homes.co.nz scrape success.")
    except Exception as e:
        home.db_set("scraper_status", "Failed")
        home.db_set("scraper_message", f"Homes.co.nz scraper failed: {e}")
        frappe.log_error(f"Home homes.co.nz scraper error for {docname}: {e}", "homemain.property_homes_scraper")
        print(f"[ERROR] Homes.co.nz scraper failed for {docname}: {e}")
    finally:
        frappe.db.commit()
        print(f"[INFO] Home {docname} updated (homes.co.nz).")

# Optional: for local/standalone run
if __name__ == "__main__":
    address = "2 Barberry Grove, Maungaraki"
    result = asyncio.run(_async_scrape_homes(address))
    print(result)
