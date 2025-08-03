import asyncio
from urllib.parse import quote_plus
import requests
from playwright.async_api import async_playwright, TimeoutError
import pdfplumber
import fitz  # PyMuPDF
import re
import os

def clean_address(addr):
    return ' '.join(addr.strip().lower().split())

async def scrape_hcc_property(address_query):
    print("[INFO] Launching browser for property search...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, slow_mo=100)
        try:
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            query_url = "https://www.huttcity.govt.nz/property-and-building/search-property-and-building?query=" + quote_plus(address_query)
            print(f"[INFO] Navigating to: {query_url}")
            await page.goto(query_url, wait_until="domcontentloaded", timeout=90000)
            await asyncio.sleep(3)

            print("[INFO] Waiting for results or 'No results' message...")
            table_selector = ".smp-search-table-results__wrapper"
            try:
                await page.wait_for_selector(table_selector, timeout=10000)
                print("[INFO] Results table found.")
            except TimeoutError:
                print("[ERROR] No results table, aborting.")
                return None, None

            rows = await page.locator(f"{table_selector} tr").all()
            print(f"[INFO] Found {len(rows)} search result rows.")

            # Find matching row for exact address
            target_address = clean_address(address_query)
            target_link = None
            property_id = None
            for row in rows:
                cells = await row.locator("td").all()
                if len(cells) >= 3:
                    cell_text = clean_address(await cells[2].text_content() or '')
                    print(f"[DEBUG] Checking address cell: {cell_text}")
                    if cell_text == target_address:
                        print(f"[SUCCESS] Matched address: {cell_text}")
                        link = await cells[0].locator("a").element_handle()
                        property_id = (await cells[1].text_content()).strip()
                        print(f"[INFO] Property ID: {property_id}")
                        if link:
                            target_link = link
                            break

            if not target_link:
                print("[ERROR] No property result found for", address_query)
                return None, None

            print("[INFO] Clicking through to property details page...")
            await target_link.click()
            await page.wait_for_load_state("networkidle", timeout=10000)  # usually faster/more robust
            try:
                await page.wait_for_selector(".table-responsive", timeout=5000)
            except TimeoutError:
                print("[ERROR] Table didn't load quickly.")
                return {}, property_id

            rows = await page.locator(".table-responsive tr").all()
            details = {}
            for row in rows:
                try:
                    label = (await row.locator("th").text_content()).strip()
                    value = (await row.locator("td").text_content()).strip()
                    details[label] = value
                except Exception:
                    continue
            print(f"[INFO] Property details scraped: {details}")

            return details, property_id
        finally:
            await browser.close()
            print("[INFO] Closed browser.")

async def download_rates_pdf(property_id, save_path):
    print(f"[INFO] Downloading rates PDF for property ID {property_id}...")
    url = f"https://maps.huttcity.govt.nz/Ratesreport/load.html?address={property_id}"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        await page.goto(url)
        await page.wait_for_selector("#Results a", timeout=60000)
        pdf_url = await page.locator("#Results a").get_attribute("href")
        print(f"[INFO] Found PDF link: {pdf_url}")
        await browser.close()
    if pdf_url.startswith('/'):
        pdf_url = 'https://maps.huttcity.govt.nz' + pdf_url
    response = requests.get(pdf_url)
    with open(save_path, "wb") as f:
        f.write(response.content)
    print(f"[SUCCESS] Downloaded PDF to {save_path}")

def extract_image_by_index(pdf_path, image_index=0, save_as="property_image.jpg"):
    doc = fitz.open(pdf_path)
    image_counter = 0
    for page_num in range(len(doc)):
        page = doc[page_num]
        img_list = page.get_images(full=True)
        for img in img_list:
            if image_counter == image_index:
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                ext = base_image["ext"]
                out_file = f"{save_as.rsplit('.',1)[0]}.{ext}"
                with open(out_file, "wb") as f:
                    f.write(image_bytes)
                print(f"Saved image #{image_index+1} as {out_file}")
                return out_file
            image_counter += 1
    print(f"No image at index {image_index} (found {image_counter} images total).")
    return None

def parse_rates_pdf_text(text):
    result = {}
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    def find_field(label, fallback_label=None):
        for i, line in enumerate(lines):
            if line.startswith(label):
                # Look for the next non-label, non-empty line
                for next_line in lines[i+1:]:
                    # Skip if this is another label
                    if fallback_label and next_line.startswith(fallback_label):
                        continue
                    # Skip if it's obviously a label or money field
                    if (next_line.endswith("Not Available") or
                        "$" in next_line or
                        next_line.endswith("Council")):
                        continue
                    return next_line
        return ""

    result['address'] = find_field("Property Address")
    result['legal_description'] = find_field("Legal Description")
    result['record_of_title'] = find_field("Record of Title")
    result['valuation_number'] = find_field("Valuation Number")
    result['property_area_sqm'] = find_field("Total Property Area (sq.m)")

    m = re.search(r'Capital Value \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['capital_value'] = m.group(1).replace(",", "")
    m = re.search(r'Land Value \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['land_value'] = m.group(1).replace(",", "")
    m = re.search(r'Rates - City Council \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['city_council_rates'] = m.group(1).replace(",", "")
    m = re.search(r'Rates - Regional Council \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['regional_council_rates'] = m.group(1).replace(",", "")
    m = re.search(r'Total Rates Charge \$[0-9,\.]+ \$([0-9,\.]+)', text)
    if m:
        result['total_rates'] = m.group(1).replace(",", "")
    return result

def extract_pdf_text(pdf_path):
    with open(pdf_path, "rb") as f:
        with pdfplumber.open(f) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    return text

async def main():
    address_query = "2 Barberry Grove MAUNGARAKI"
    details, property_id = await scrape_hcc_property(address_query)
    all_data = {}
    if property_id:
        save_path = f"rates_{property_id}.pdf"
        await download_rates_pdf(property_id, save_path)

        # --- PDF parsing
        pdf_text = extract_pdf_text(save_path)
        pdf_info = parse_rates_pdf_text(pdf_text)

        # --- PDF image extraction (main image, e.g. site map/photo)
        main_image = extract_image_by_index(save_path, image_index=0, save_as=f"{property_id}_main_image.jpg")

        # Combine and output
        all_data = {
            "property_web_details": details,
            "pdf_rates_info": pdf_info,
            "main_image_file": main_image
        }
        print("\n==== ALL PROPERTY INFO ====")
        from pprint import pprint
        pprint(all_data)
    else:
        print("[FAIL] No property ID found, cannot download rates PDF.")

if __name__ == "__main__":
    asyncio.run(main())
